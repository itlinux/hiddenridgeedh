from fastapi import APIRouter, HTTPException, Depends, Request, status
from datetime import datetime, timedelta
from bson import ObjectId
from database import get_db, get_settings
from models.schemas import UserCreate, UserInDB, Token, LoginRequest, UserRole
from middleware.auth import hash_password, verify_password, create_access_token, get_current_user
from utils.email import send_pending_notification, send_admin_new_user_alert, send_verification_email
from utils.turnstile import verify_turnstile
from utils.rate_limit import is_ip_blocked, record_failed_login, record_successful_login, get_all_blocked_ips, unblock_ip
from utils.limiter import limiter
import pyotp
import qrcode
import io
import base64
import secrets

router = APIRouter(prefix="/api/auth", tags=["auth"])


def serialize_user(user: dict) -> dict:
    user["id"] = str(user["_id"])
    del user["_id"]
    user.pop("password_hash", None)
    user.pop("totp_secret", None)
    user.pop("totp_backup_codes", None)
    user.pop("verification_token", None)
    user["totp_enabled"] = user.get("totp_enabled", False)
    user["sms_opt_in"] = user.get("sms_opt_in", False)
    return user


@router.post("/register", status_code=201)
@limiter.limit("5/hour")
async def register(request: Request, data: UserCreate):
    if data.turnstile_token:
        await verify_turnstile(data.turnstile_token)

    db = get_db()
    settings = get_settings()

    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(400, detail="That email is already registered.")

    # Auto-generate username from email prefix
    username = data.email.split("@")[0].lower()
    # Ensure uniqueness by appending a number if needed
    base_username = username
    counter = 1
    while await db.users.find_one({"username": username}):
        username = f"{base_username}{counter}"
        counter += 1

    verification_token = secrets.token_urlsafe(32)

    user_doc = {
        "email": data.email,
        "username": username,
        "full_name": data.full_name,
        "address": data.address,
        "bio": data.bio,
        "phone": data.phone,
        "sms_opt_in": data.sms_opt_in,
        "email_opt_in": data.email_opt_in,
        "avatar_url": None,
        "password_hash": hash_password(data.password),
        "role": UserRole.PENDING,
        "is_active": True,
        "is_approved": False,
        "email_verified": False,
        "verification_token": verification_token,
        "created_at": datetime.utcnow(),
        "approved_at": None,
        "approved_by": None,
    }

    result = await db.users.insert_one(user_doc)
    user_doc["id"] = str(result.inserted_id)

    # Send verification email (with password for user reference)
    try:
        verify_url = f"{settings.app_url}/api/auth/verify-email?token={verification_token}"
        await send_verification_email(data.email, data.full_name, data.password, verify_url)
    except Exception:
        pass  # Don't fail registration if email fails

    return {"message": "Please check your email to verify your address.", "user_id": user_doc["id"]}


@router.get("/verify-email")
async def verify_email(token: str):
    from fastapi.responses import RedirectResponse

    db = get_db()
    settings = get_settings()

    user = await db.users.find_one({"verification_token": token})
    if not user:
        raise HTTPException(400, detail="Invalid or expired verification link.")

    if user.get("email_verified"):
        return RedirectResponse(f"{settings.app_url}/login?verified=already")

    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"email_verified": True}, "$unset": {"verification_token": ""}},
    )

    # Now send pending notification to user and admin alert
    try:
        await send_pending_notification(user["email"], user["full_name"])
        if settings.admin_email:
            await send_admin_new_user_alert(
                settings.admin_email, user["full_name"], user["email"], settings.app_url
            )
    except Exception:
        pass

    return RedirectResponse(f"{settings.app_url}/login?verified=true")


def _get_client_ip(request: Request) -> str:
    """Extract client IP, respecting X-Forwarded-For behind nginx."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _get_whitelist() -> list[str]:
    settings = get_settings()
    raw = settings.login_whitelist_ips.strip()
    if not raw:
        return []
    return [ip.strip() for ip in raw.split(",") if ip.strip()]


@router.post("/login")
async def login(data: LoginRequest, request: Request):
    client_ip = _get_client_ip(request)
    settings = get_settings()
    whitelist = _get_whitelist()

    # Check if IP is currently blocked
    blocked, remaining = is_ip_blocked(
        client_ip,
        max_attempts=settings.login_max_attempts,
        block_minutes=settings.login_block_minutes,
        whitelist=whitelist,
    )
    if blocked:
        minutes = remaining // 60
        raise HTTPException(
            status_code=429,
            detail=f"Too many failed login attempts. Try again in {minutes + 1} minute{'s' if minutes else ''}.",
        )

    if data.turnstile_token:
        await verify_turnstile(data.turnstile_token)

    db = get_db()
    user = await db.users.find_one({"email": data.email})

    if not user or not verify_password(data.password, user.get("password_hash", "")):
        # Record failed attempt
        now_blocked, remaining = record_failed_login(
            client_ip,
            max_attempts=settings.login_max_attempts,
            block_minutes=settings.login_block_minutes,
            whitelist=whitelist,
        )
        if now_blocked:
            raise HTTPException(
                status_code=429,
                detail=f"Too many failed login attempts. Your IP has been blocked for {settings.login_block_minutes} minutes.",
            )
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.get("is_active"):
        raise HTTPException(status_code=400, detail="Account deactivated")

    if not user.get("email_verified", True):
        raise HTTPException(status_code=400, detail="Please verify your email address first. Check your inbox for the verification link.")

    # Successful credentials — clear rate limit
    record_successful_login(client_ip)

    # Check if 2FA is enabled
    if user.get("totp_enabled"):
        # Return a temporary token that requires 2FA verification
        temp_token = create_access_token(
            {"sub": str(user["_id"]), "2fa_pending": True},
            expires_delta=timedelta(minutes=5),
        )
        return {"requires_2fa": True, "temp_token": temp_token}

    token = create_access_token({"sub": str(user["_id"])})
    return {"access_token": token, "token_type": "bearer", "user": serialize_user(user)}


@router.get("/me")
async def get_me(current_user=Depends(get_current_user)):
    return serialize_user(current_user)


@router.put("/change-password")
async def change_password(
    data: dict,
    current_user: dict = Depends(get_current_user),
):
    current_password = data.get("current_password", "")
    new_password = data.get("new_password", "")

    if not current_password or not new_password:
        raise HTTPException(400, "Both current and new password are required")
    if len(new_password) < 8:
        raise HTTPException(400, "New password must be at least 8 characters")
    if not verify_password(current_password, current_user.get("password_hash", "")):
        raise HTTPException(400, "Current password is incorrect")

    db = get_db()
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"password_hash": hash_password(new_password)}},
    )
    return {"message": "Password updated successfully"}


@router.post("/logout")
async def logout():
    # JWT is stateless; client discards token
    return {"message": "Logged out"}


# ─── 2FA TOTP Endpoints ──────────────────────────────────────────────────────

@router.post("/2fa/setup")
async def setup_2fa(current_user: dict = Depends(get_current_user)):
    """Generate a TOTP secret and QR code for the user to scan."""
    if current_user.get("totp_enabled"):
        raise HTTPException(400, "2FA is already enabled")

    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(
        name=current_user["email"],
        issuer_name="Hidden Ridge EDH",
    )

    # Generate QR code as base64 PNG
    img = qrcode.make(provisioning_uri)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    qr_base64 = base64.b64encode(buf.getvalue()).decode()

    # Generate backup codes
    backup_codes = [secrets.token_hex(4) for _ in range(8)]

    # Store secret + backup codes temporarily (not yet enabled)
    db = get_db()
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {
            "totp_secret": secret,
            "totp_backup_codes": backup_codes,
        }},
    )

    return {
        "secret": secret,
        "qr_code": f"data:image/png;base64,{qr_base64}",
        "backup_codes": backup_codes,
    }


@router.post("/2fa/enable")
async def enable_2fa(data: dict, current_user: dict = Depends(get_current_user)):
    """Verify a TOTP code and enable 2FA for the user."""
    code = data.get("code", "")
    if not code:
        raise HTTPException(400, "Verification code is required")

    secret = current_user.get("totp_secret")
    if not secret:
        raise HTTPException(400, "Run /2fa/setup first")

    totp = pyotp.TOTP(secret)
    if not totp.verify(code, valid_window=1):
        raise HTTPException(400, "Invalid verification code")

    db = get_db()
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"totp_enabled": True}},
    )
    return {"message": "2FA enabled successfully"}


@router.post("/2fa/verify")
async def verify_2fa(data: dict):
    """Verify a TOTP code during login (second step)."""
    temp_token = data.get("temp_token", "")
    code = data.get("code", "")

    if not temp_token or not code:
        raise HTTPException(400, "Token and code are required")

    from jose import JWTError, jwt as jose_jwt
    settings = get_settings()

    try:
        payload = jose_jwt.decode(temp_token, settings.secret_key, algorithms=["HS256"])
        user_id = payload.get("sub")
        if not user_id or not payload.get("2fa_pending"):
            raise HTTPException(401, "Invalid token")
    except JWTError:
        raise HTTPException(401, "Invalid or expired token")

    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(401, "User not found")

    secret = user.get("totp_secret", "")
    totp = pyotp.TOTP(secret)

    # Check TOTP code
    if totp.verify(code, valid_window=1):
        token = create_access_token({"sub": str(user["_id"])})
        return {"access_token": token, "token_type": "bearer", "user": serialize_user(user)}

    # Check backup codes
    backup_codes = user.get("totp_backup_codes", [])
    if code in backup_codes:
        backup_codes.remove(code)
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"totp_backup_codes": backup_codes}},
        )
        token = create_access_token({"sub": str(user["_id"])})
        return {"access_token": token, "token_type": "bearer", "user": serialize_user(user)}

    raise HTTPException(400, "Invalid verification code")


@router.post("/2fa/disable")
async def disable_2fa(data: dict, current_user: dict = Depends(get_current_user)):
    """Disable 2FA (requires current password)."""
    password = data.get("password", "")
    if not verify_password(password, current_user.get("password_hash", "")):
        raise HTTPException(400, "Invalid password")

    db = get_db()
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"totp_enabled": False}, "$unset": {"totp_secret": "", "totp_backup_codes": ""}},
    )
    return {"message": "2FA disabled"}


# ─── Login Rate-Limit Admin Endpoints ────────────────────────────────────────

from middleware.auth import require_super_admin


@router.get("/blocked-ips")
async def list_blocked_ips(current_user: dict = Depends(require_super_admin)):
    """List all currently blocked IPs (super_admin only)."""
    return {"blocked_ips": get_all_blocked_ips()}


@router.delete("/blocked-ips/{ip}")
async def admin_unblock_ip(ip: str, current_user: dict = Depends(require_super_admin)):
    """Manually unblock an IP (super_admin only)."""
    if unblock_ip(ip):
        return {"message": f"IP {ip} unblocked"}
    raise HTTPException(404, f"IP {ip} is not currently blocked")
