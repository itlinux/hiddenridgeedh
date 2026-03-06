from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from bson import ObjectId
from database import get_db
from models.schemas import NewsletterSubscribe, NewsletterSend
from middleware.auth import get_super_admin
from utils.email import send_bulk_email, send_email
import secrets

router = APIRouter(prefix="/api/newsletter", tags=["newsletter"])


@router.post("/subscribe")
async def subscribe(data: NewsletterSubscribe):
    db = get_db()
    existing = await db.newsletter_subscribers.find_one({"email": data.email})
    if existing:
        if existing.get("is_active"):
            return {"message": "You're already subscribed."}
        else:
            await db.newsletter_subscribers.update_one(
                {"email": data.email},
                {"$set": {"is_active": True, "resubscribed_at": datetime.utcnow()}}
            )
            return {"message": "Welcome back! You've been resubscribed."}

    unsubscribe_token = secrets.token_urlsafe(32)
    await db.newsletter_subscribers.insert_one({
        "email": data.email,
        "name": data.name,
        "is_active": True,
        "unsubscribe_token": unsubscribe_token,
        "subscribed_at": datetime.utcnow(),
    })
    return {"message": "Successfully subscribed to the Hidden Ridge EDH newsletter!"}


@router.get("/unsubscribe/{token}")
async def unsubscribe(token: str):
    db = get_db()
    subscriber = await db.newsletter_subscribers.find_one({"unsubscribe_token": token})
    if not subscriber:
        raise HTTPException(404, "Invalid unsubscribe link")
    await db.newsletter_subscribers.update_one(
        {"unsubscribe_token": token},
        {"$set": {"is_active": False, "unsubscribed_at": datetime.utcnow()}}
    )
    return {"message": "You've been unsubscribed from the Hidden Ridge EDH newsletter."}


@router.get("/subscribers")
async def list_subscribers(current_user=Depends(get_super_admin)):
    db = get_db()
    cursor = db.newsletter_subscribers.find({"is_active": True})
    subs = []
    async for s in cursor:
        s["id"] = str(s["_id"])
        del s["_id"]
        subs.append(s)
    return {"subscribers": subs, "total": len(subs)}


@router.post("/send")
async def send_newsletter(data: NewsletterSend, current_user=Depends(get_super_admin)):
    db = get_db()
    cursor = db.newsletter_subscribers.find({"is_active": True})
    recipients = []
    async for s in cursor:
        recipients.append({
            "email": s["email"],
            "name": s.get("name", ""),
            "token": s.get("unsubscribe_token", "")
        })

    if not recipients:
        raise HTTPException(400, "No active subscribers")

    from database import get_settings
    settings = get_settings()

    html_template = f"""
    <div style="font-family: Georgia, serif; max-width: 640px; margin: 0 auto; background: #FAFAF7;">
      <div style="background: #1B2E1F; padding: 32px; text-align: center;">
        <h1 style="color: #C9A84C; margin: 0; font-size: 24px; letter-spacing: 2px;">HIDDEN RIDGE EDH</h1>
        <p style="color: #8B9E8D; margin: 8px 0 0; font-size: 12px; letter-spacing: 3px; text-transform: uppercase;">Community Newsletter</p>
      </div>
      <div style="padding: 40px; background: white;">
        <div style="color: #2D3748; line-height: 1.8; font-size: 16px;">
          {data.content}
        </div>
      </div>
      <div style="padding: 24px; text-align: center; background: #F7F4EE; border-top: 1px solid #E8E0D0;">
        <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
          Hidden Ridge EDH · El Dorado Hills, CA<br>
          <a href="{settings.app_url}" style="color: #8B7355;">Visit Community Portal</a> ·
          <a href="{settings.app_url}/newsletter/unsubscribe/{{token}}" style="color: #8B7355;">Unsubscribe</a>
        </p>
      </div>
    </div>
    """

    errors = []
    for r in recipients:
        personalized = html_template.replace("{token}", r.get("token", ""))
        try:
            await send_email(r["email"], r.get("name", ""), data.subject, personalized)
        except Exception as e:
            errors.append({"email": r["email"], "error": str(e)})

    # Log send
    await db.newsletter_sends.insert_one({
        "subject": data.subject,
        "sent_by": str(current_user["_id"]),
        "recipient_count": len(recipients),
        "error_count": len(errors),
        "sent_at": datetime.utcnow(),
    })

    return {
        "message": f"Newsletter sent to {len(recipients) - len(errors)} subscribers",
        "sent": len(recipients) - len(errors),
        "errors": len(errors)
    }
