"""
Login rate limiting — blocks IPs for a configurable duration after too many
failed login attempts.  Uses an in-memory store (resets on server restart).

Whitelist supports CIDR notation (e.g. "208.53.44.225/32, 10.10.10.0/24").
"""

from datetime import datetime, timedelta
from ipaddress import ip_address, ip_network
from typing import Dict, Tuple
import threading

# ip -> (fail_count, first_fail_time, blocked_until)
_login_attempts: Dict[str, Tuple[int, datetime, datetime | None]] = {}
_lock = threading.Lock()

DEFAULT_MAX_ATTEMPTS = 5
DEFAULT_BLOCK_MINUTES = 15


def _is_whitelisted(ip: str, whitelist: list[str] | None) -> bool:
    """Check if an IP matches any entry in the whitelist (supports CIDR)."""
    if not whitelist:
        return False
    try:
        addr = ip_address(ip)
    except ValueError:
        return False
    for entry in whitelist:
        entry = entry.strip()
        if not entry:
            continue
        try:
            network = ip_network(entry, strict=False)
            if addr in network:
                return True
        except ValueError:
            # Fallback: plain IP string comparison
            if ip == entry:
                return True
    return False


def _cleanup_old_entries():
    """Remove entries that have fully expired (block lifted + idle > 30 min)."""
    now = datetime.utcnow()
    cutoff = now - timedelta(minutes=60)
    expired = [
        ip for ip, (_, first, blocked) in _login_attempts.items()
        if first < cutoff and (blocked is None or blocked < now)
    ]
    for ip in expired:
        del _login_attempts[ip]


def is_ip_blocked(ip: str, max_attempts: int = DEFAULT_MAX_ATTEMPTS,
                  block_minutes: int = DEFAULT_BLOCK_MINUTES,
                  whitelist: list[str] | None = None) -> Tuple[bool, int]:
    """
    Check if an IP is currently blocked.

    Returns:
        (is_blocked, remaining_seconds)
    """
    if _is_whitelisted(ip, whitelist):
        return False, 0

    with _lock:
        _cleanup_old_entries()
        entry = _login_attempts.get(ip)
        if not entry:
            return False, 0

        count, first_fail, blocked_until = entry
        now = datetime.utcnow()

        if blocked_until and blocked_until > now:
            remaining = int((blocked_until - now).total_seconds())
            return True, remaining

        # If block has expired, reset the counter
        if blocked_until and blocked_until <= now:
            del _login_attempts[ip]
            return False, 0

        return False, 0


def record_failed_login(ip: str, max_attempts: int = DEFAULT_MAX_ATTEMPTS,
                        block_minutes: int = DEFAULT_BLOCK_MINUTES,
                        whitelist: list[str] | None = None) -> Tuple[bool, int]:
    """
    Record a failed login attempt for an IP.

    Returns:
        (now_blocked, remaining_seconds)  — remaining is 0 if not blocked.
    """
    if _is_whitelisted(ip, whitelist):
        return False, 0

    with _lock:
        now = datetime.utcnow()
        entry = _login_attempts.get(ip)

        if entry:
            count, first_fail, blocked_until = entry
            # If previously blocked and expired, start fresh
            if blocked_until and blocked_until <= now:
                count = 0
                first_fail = now
            count += 1
        else:
            count = 1
            first_fail = now

        blocked_until = None
        remaining = 0

        if count >= max_attempts:
            blocked_until = now + timedelta(minutes=block_minutes)
            remaining = block_minutes * 60

        _login_attempts[ip] = (count, first_fail, blocked_until)
        return count >= max_attempts, remaining


def record_successful_login(ip: str):
    """Clear failed attempts for an IP after a successful login."""
    with _lock:
        _login_attempts.pop(ip, None)


def get_all_blocked_ips() -> list[dict]:
    """Return list of currently blocked IPs (for admin dashboard)."""
    now = datetime.utcnow()
    blocked = []
    with _lock:
        for ip, (count, first_fail, blocked_until) in _login_attempts.items():
            if blocked_until and blocked_until > now:
                blocked.append({
                    "ip": ip,
                    "attempts": count,
                    "blocked_until": blocked_until.isoformat(),
                    "remaining_seconds": int((blocked_until - now).total_seconds()),
                })
    return blocked


def unblock_ip(ip: str) -> bool:
    """Manually unblock an IP (admin action)."""
    with _lock:
        if ip in _login_attempts:
            del _login_attempts[ip]
            return True
        return False
