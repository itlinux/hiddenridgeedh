"""
Neighborhood Safety Alerts — CRUD + Twilio inbound SMS webhook.

Flow:
1. Registered user (with sms_opt_in + phone on file) sends SMS to the Twilio number.
2. Twilio POSTs to /api/alerts/sms/inbound with the message body + sender phone.
3. Backend matches the phone to a registered user → auto-creates an alert.
4. Alert appears on the /safety page for all logged-in members.
5. Admins (or the alert author) can delete alerts.
"""

import re
import asyncio
import hashlib
import hmac
import logging
from urllib.parse import urlencode
from fastapi import APIRouter, HTTPException, Depends, Query, Request, Form, Response
from datetime import datetime
from bson import ObjectId

from database import get_db, get_settings
from models.schemas import AlertCreate
from middleware.auth import require_member, require_super_admin, get_current_user
from utils.limiter import limiter
from utils.email import send_alert_emails_to_opted_in

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


def serialize_alert(alert: dict) -> dict:
    alert["id"] = str(alert["_id"])
    del alert["_id"]
    return alert


def _normalize_phone(phone: str) -> str:
    """Strip a phone to digits only, prepend +1 if needed for US numbers."""
    digits = re.sub(r"\D", "", phone)
    if len(digits) == 10:
        digits = "1" + digits
    return f"+{digits}"


def _get_public_url(request: Request) -> str:
    """Reconstruct the public URL that Twilio used (not the internal proxy URL)."""
    # Use X-Forwarded-Proto and Host headers set by nginx
    proto = request.headers.get("X-Forwarded-Proto", "https")
    host = request.headers.get("Host", "hiddenridgeedh.com")
    path = request.url.path
    return f"{proto}://{host}{path}"


def _validate_twilio_signature(request: Request, params: dict) -> bool:
    """Validate that the request actually came from Twilio (X-Twilio-Signature)."""
    import base64

    settings = get_settings()
    if not settings.twilio_auth_token:
        return False  # Can't validate without auth token

    signature = request.headers.get("X-Twilio-Signature", "")
    if not signature:
        logger.warning("Twilio webhook missing X-Twilio-Signature header")
        return False

    # Build the full URL Twilio used to reach us (public URL, not internal proxy URL)
    url = _get_public_url(request)
    # Twilio builds the string as: URL + sorted POST params concatenated
    sorted_params = sorted(params.items())
    data_str = url + "".join(f"{k}{v}" for k, v in sorted_params)

    # HMAC-SHA1 with auth token
    expected = hmac.HMAC(
        settings.twilio_auth_token.encode("utf-8"),
        data_str.encode("utf-8"),
        hashlib.sha1,
    ).digest()

    expected_b64 = base64.b64encode(expected).decode("utf-8")
    valid = hmac.compare_digest(signature, expected_b64)
    if not valid:
        logger.warning(f"Twilio signature mismatch. URL used: {url}")
    return valid


# ── List alerts (all logged-in members) ───────────────────────────
@router.get("")
async def list_alerts(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(require_member),
):
    db = get_db()
    total = await db.alerts.count_documents({})
    cursor = db.alerts.find().sort("created_at", -1).skip(skip).limit(limit)
    alerts = [serialize_alert(a) async for a in cursor]
    return {"alerts": alerts, "total": total}


# ── Create alert manually (logged-in members) ────────────────────
@router.post("", status_code=201)
@limiter.limit("5/hour")
async def create_alert(
    request: Request,
    data: AlertCreate,
    current_user: dict = Depends(require_member),
):
    db = get_db()
    now = datetime.utcnow()
    alert_doc = {
        "message": data.message,
        "category": data.category,
        "author_id": str(current_user["_id"]),
        "author_name": current_user.get("full_name", current_user.get("username")),
        "source": "web",
        "created_at": now,
    }
    result = await db.alerts.insert_one(alert_doc)
    alert_doc["id"] = str(result.inserted_id)

    # Fire-and-forget email notifications to opted-in members
    asyncio.create_task(send_alert_emails_to_opted_in(
        author_id=str(current_user["_id"]),
        author_name=alert_doc["author_name"],
        message=data.message,
        category=data.category,
        source="web",
    ))

    return serialize_alert(alert_doc)


# ── Delete alert (author or super_admin) ──────────────────────────
@router.delete("/{alert_id}", status_code=204)
async def delete_alert(
    alert_id: str,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    alert = await db.alerts.find_one({"_id": ObjectId(alert_id)})
    if not alert:
        raise HTTPException(404, "Alert not found")

    is_author = alert.get("author_id") == str(current_user["_id"])
    is_admin = current_user.get("role") in ("super_admin", "content_admin")
    if not is_author and not is_admin:
        raise HTTPException(403, "Not authorized to delete this alert")

    await db.alerts.delete_one({"_id": ObjectId(alert_id)})


# ── Twilio inbound SMS webhook ────────────────────────────────────
@router.post("/sms/inbound")
async def sms_inbound(
    request: Request,
    From: str = Form(...),
    Body: str = Form(""),
):
    """
    Twilio sends POST with Form data: From (phone), Body (message), etc.
    We match the sender's phone to a registered user, then create an alert.
    """
    logger.info(f"SMS inbound webhook hit — From: {From}, Body: {Body[:50] if Body else '(empty)'}")
    settings = get_settings()

    # Validate Twilio signature if auth token is configured
    if settings.twilio_auth_token:
        form_data = await request.form()
        params = {k: v for k, v in form_data.items()}
        if not _validate_twilio_signature(request, params):
            logger.warning(f"Twilio signature validation FAILED for From: {From}")
            raise HTTPException(403, "Invalid Twilio signature")

    # Normalize incoming phone number
    sender_phone = _normalize_phone(From)
    message_body = Body.strip()

    if not message_body:
        # Respond with TwiML — empty message
        return Response(
            content='<?xml version="1.0" encoding="UTF-8"?><Response><Message>Please include a message for the neighborhood alert.</Message></Response>',
            media_type="application/xml",
        )

    if len(message_body) > 1000:
        message_body = message_body[:1000]

    # Look up user by phone number
    db = get_db()

    # Try matching with different phone formats
    phone_digits = re.sub(r"\D", "", From)
    user = None

    # Search for the user by normalized phone patterns
    # Note: sms_opt_in controls receiving notifications, not sending alerts
    async for u in db.users.find({
        "is_active": True,
        "is_approved": True,
        "phone": {"$exists": True, "$ne": ""},
    }):
        user_phone_digits = re.sub(r"\D", "", u.get("phone", ""))
        # Match last 10 digits (ignore country code)
        if user_phone_digits[-10:] == phone_digits[-10:] and len(user_phone_digits) >= 10:
            user = u
            break

    if not user:
        logger.warning(f"SMS from unregistered phone: {sender_phone}")
        # Unknown number — reply with rejection
        return Response(
            content='<?xml version="1.0" encoding="UTF-8"?><Response><Message>Your phone number is not registered with Hidden Ridge EDH or SMS is not enabled on your account. Please register at hiddenridgeedh.com and enable SMS notifications.</Message></Response>',
            media_type="application/xml",
        )

    # Create the alert
    now = datetime.utcnow()
    alert_doc = {
        "message": message_body,
        "category": "sms-alert",
        "author_id": str(user["_id"]),
        "author_name": user.get("full_name", user.get("username")),
        "source": "sms",
        "phone_from": sender_phone,
        "created_at": now,
    }
    await db.alerts.insert_one(alert_doc)
    logger.info(f"SMS alert created from {sender_phone} by {alert_doc['author_name']}")

    # Fire-and-forget email notifications to opted-in members
    asyncio.create_task(send_alert_emails_to_opted_in(
        author_id=str(user["_id"]),
        author_name=alert_doc["author_name"],
        message=message_body,
        category="sms-alert",
        source="sms",
    ))

    # Reply with confirmation TwiML
    author_name = user.get("full_name", "Neighbor")
    return Response(
        content=f'<?xml version="1.0" encoding="UTF-8"?><Response><Message>Thanks {author_name}! Your alert has been posted to the Hidden Ridge neighborhood.</Message></Response>',
        media_type="application/xml",
    )
