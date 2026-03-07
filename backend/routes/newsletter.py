import secrets
from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime

from database import get_db
from models.schemas import NewsletterSubscribe, NewsletterSend
from middleware.auth import require_super_admin
from utils.email import send_newsletter

router = APIRouter(prefix="/api/newsletter", tags=["newsletter"])


@router.post("/subscribe", status_code=201)
async def subscribe(data: NewsletterSubscribe):
    db = get_db()
    existing = await db.newsletter_subscribers.find_one({"email": data.email})

    if existing:
        if existing.get("is_active"):
            return {"message": "Already subscribed"}
        # Reactivate
        await db.newsletter_subscribers.update_one(
            {"email": data.email},
            {"$set": {"is_active": True, "subscribed_at": datetime.utcnow()}},
        )
        return {"message": "Subscription reactivated"}

    await db.newsletter_subscribers.insert_one({
        "email": data.email,
        "subscribed_at": datetime.utcnow(),
        "unsubscribe_token": secrets.token_urlsafe(32),
        "is_active": True,
    })
    return {"message": "Subscribed successfully"}


@router.get("/unsubscribe")
async def unsubscribe(token: str = Query(...)):
    db = get_db()
    result = await db.newsletter_subscribers.update_one(
        {"unsubscribe_token": token},
        {"$set": {"is_active": False}},
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Invalid unsubscribe link")
    return {"message": "You have been unsubscribed"}


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
            "subscribed_at": sub.get("subscribed_at"),
        })
    return {"subscribers": subscribers}


@router.post("/send")
async def send(
    data: NewsletterSend,
    current_user: dict = Depends(require_super_admin),
):
    db = get_db()
    cursor = db.newsletter_subscribers.find({"is_active": True})
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
