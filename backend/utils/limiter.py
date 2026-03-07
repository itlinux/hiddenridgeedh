"""
Shared rate limiter instance for use across route modules.

Limits are applied per real client IP (X-Forwarded-For aware).
Default: 120 requests/minute per IP across all endpoints.
Individual endpoints can override with @limiter.limit("10/hour").
"""

from fastapi import Request
from slowapi import Limiter


def _get_real_ip(request: Request) -> str:
    """Extract real client IP behind nginx proxy."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


limiter = Limiter(key_func=_get_real_ip, default_limits=["120/minute"])
