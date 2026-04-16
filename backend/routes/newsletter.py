import secrets
from fastapi import APIRouter, HTTPException, Depends, Query, Request
from fastapi.responses import RedirectResponse
from datetime import datetime

from database import get_db, get_settings
from models.schemas import NewsletterSubscribe, NewsletterSend
from middleware.auth import require_super_admin
from utils.email import send_newsletter, send_newsletter_confirm_email, send_newsletter_welcome, send_newsletter_unsubscribe_confirmation
from utils.turnstile import verify_turnstile
from utils.limiter import limiter
from utils.mautic import push_to_mautic

router = APIRouter(prefix="/api/newsletter", tags=["newsletter"])


@router.post("/subscribe", status_code=201)
@limiter.limit("5/hour")
async def subscribe(request: Request, data: NewsletterSubscribe):
    if data.turnstile_token:
        await verify_turnstile(data.turnstile_token)

    db = get_db()
    existing = await db.newsletter_subscribers.find_one({"email": data.email})

    if existing:
        if existing.get("is_active"):
            return {"message": "Already subscribed"}
        if existing.get("confirmed"):
            # Was confirmed before, just reactivate
            await db.newsletter_subscribers.update_one(
                {"email": data.email},
                {"$set": {"is_active": True, "subscribed_at": datetime.utcnow()}},
            )
            return {"message": "Subscription reactivated"}
        # Not yet confirmed — resend confirmation
        await send_newsletter_confirm_email(data.email, existing["confirm_token"])
        return {"message": "Check your email to confirm your subscription"}

    confirm_token = secrets.token_urlsafe(32)
    unsub_token = secrets.token_urlsafe(32)
    await db.newsletter_subscribers.insert_one({
        "email": data.email,
        "subscribed_at": datetime.utcnow(),
        "confirm_token": confirm_token,
        "unsubscribe_token": unsub_token,
        "confirmed": False,
        "is_active": False,
    })
    await send_newsletter_confirm_email(data.email, confirm_token)
    return {"message": "Check your email to confirm your subscription"}


@router.get("/confirm")
async def confirm(token: str = Query(...)):
    db = get_db()
    settings = get_settings()
    sub = await db.newsletter_subscribers.find_one({"confirm_token": token})
    if not sub:
        return RedirectResponse(f"{settings.app_url}/newsletter/confirmed?status=invalid")
    if sub.get("confirmed"):
        return RedirectResponse(f"{settings.app_url}/newsletter/confirmed?status=already")
    await db.newsletter_subscribers.update_one(
        {"_id": sub["_id"]},
        {"$set": {"confirmed": True, "is_active": True, "subscribed_at": datetime.utcnow()}},
    )
    # Send welcome email with unsubscribe link.
    await send_newsletter_welcome(sub["email"], sub.get("unsubscribe_token", ""))

    # Push confirmed subscriber to Mautic (non-blocking, non-fatal).
    try:
        await push_to_mautic(sub["email"])
    except Exception:
        pass  # Local system works even if Mautic is down
    return RedirectResponse(f"{settings.app_url}/newsletter/confirmed?status=success")


@router.get("/unsubscribe")
async def unsubscribe(token: str = Query(...)):
    db = get_db()
    settings = get_settings()
    sub = await db.newsletter_subscribers.find_one({"unsubscribe_token": token})
    if not sub:
        return RedirectResponse(f"{settings.app_url}/newsletter/unsubscribed?status=invalid")
    await db.newsletter_subscribers.update_one(
        {"_id": sub["_id"]},
        {"$set": {"is_active": False}},
    )
    await send_newsletter_unsubscribe_confirmation(sub["email"])
    return RedirectResponse(f"{settings.app_url}/newsletter/unsubscribed?status=success")


@router.get("/subscribers")
async def list_subscribers(
    current_user: dict = Depends(require_super_admin),
):
    db = get_db()
    cursor = db.newsletter_subscribers.find().sort("subscribed_at", -1)
    subscribers = []
    async for sub in cursor:
        subscribers.append({
            "id": str(sub["_id"]),
            "email": sub["email"],
            "is_active": sub.get("is_active", True),
            "confirmed": sub.get("confirmed", False),
            "subscribed_at": sub.get("subscribed_at"),
        })
    return {"subscribers": subscribers}


@router.delete("/subscribers/{subscriber_id}")
async def delete_subscriber(
    subscriber_id: str,
    current_user: dict = Depends(require_super_admin),
):
    from bson import ObjectId

    db = get_db()
    result = await db.newsletter_subscribers.delete_one({"_id": ObjectId(subscriber_id)})
    if result.deleted_count == 0:
        raise HTTPException(404, "Subscriber not found")
    return {"message": "Subscriber deleted"}


@router.post("/send")
async def send(
    data: NewsletterSend,
    current_user: dict = Depends(require_super_admin),
):
    db = get_db()
    cursor = db.newsletter_subscribers.find({"is_active": True, "confirmed": True})
    subscribers = [sub["email"] async for sub in cursor]

    if not subscribers:
        raise HTTPException(400, "No active subscribers")

    sent = await send_newsletter(subscribers, data.subject, data.content)

    await db.newsletter_sends.insert_one({
        "subject": data.subject,
        "recipient_count": sent,
        "sent_by": str(current_user["_id"]),
        "sent_at": datetime.utcnow(),
    })

    return {"message": f"Newsletter sent to {sent} subscribers"}
