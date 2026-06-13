from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File
from datetime import datetime, timezone
import os, uuid
from bson import ObjectId

from database import get_db, get_settings
from models.schemas import EventCreate, EventUpdate
from middleware.auth import require_member, require_content_admin

router = APIRouter(prefix="/api/events", tags=["events"])


def serialize_event(event: dict) -> dict:
    event["id"] = str(event["_id"])
    del event["_id"]
    event["attendee_count"] = len(event.get("attendees", []))
    # Attach UTC tzinfo so JSON serialization produces +00:00 suffix.
    # Without this, JS treats naive ISO strings as local time, shifting dates.
    for field in ("start_date", "end_date", "created_at"):
        val = event.get(field)
        if isinstance(val, datetime) and val.tzinfo is None:
            event[field] = val.replace(tzinfo=timezone.utc)
    return event


@router.get("")
async def list_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    upcoming: bool = True,
):
    db = get_db()
    query: dict = {"status": {"$ne": "pending_approval"}}
    if upcoming:
        query["start_date"] = {"$gte": datetime.utcnow()}

    total = await db.events.count_documents(query)
    cursor = db.events.find(query).sort("start_date", 1).skip(skip).limit(limit)
    events = [serialize_event(e) async for e in cursor]
    return {"events": events, "total": total}


@router.get("/{event_id}")
async def get_event(event_id: str):
    db = get_db()
    event = await db.events.find_one({"_id": ObjectId(event_id)})
    if not event:
        raise HTTPException(404, "Event not found")
    return serialize_event(event)


@router.post("/submit", status_code=201)
async def submit_event(
    data: EventCreate,
    current_user: dict = Depends(require_member),
):
    """Members submit events for admin approval."""
    db = get_db()
    event_doc = {
        **data.model_dump(),
        "status": "pending_approval",
        "author_id": str(current_user["_id"]),
        "author_name": current_user.get("full_name", current_user.get("username")),
        "attendees": [],
        "created_at": datetime.utcnow(),
    }
    result = await db.events.insert_one(event_doc)
    created = await db.events.find_one({"_id": result.inserted_id})
    return serialize_event(created)


@router.post("", status_code=201)
async def create_event(
    data: EventCreate,
    current_user: dict = Depends(require_content_admin),
):
    db = get_db()
    event_doc = {
        **data.model_dump(),
        "author_id": str(current_user["_id"]),
        "attendees": [],
        "created_at": datetime.utcnow(),
    }
    result = await db.events.insert_one(event_doc)
    created = await db.events.find_one({"_id": result.inserted_id})
    return serialize_event(created)


@router.put("/{event_id}")
async def update_event(
    event_id: str,
    data: EventUpdate,
    current_user: dict = Depends(require_content_admin),
):
    db = get_db()
    event = await db.events.find_one({"_id": ObjectId(event_id)})
    if not event:
        raise HTTPException(404, "Event not found")

    updates = data.model_dump(exclude_unset=True)
    await db.events.update_one({"_id": ObjectId(event_id)}, {"$set": updates})
    updated = await db.events.find_one({"_id": ObjectId(event_id)})
    return serialize_event(updated)


@router.delete("/{event_id}", status_code=204)
async def delete_event(
    event_id: str,
    current_user: dict = Depends(require_content_admin),
):
    db = get_db()
    result = await db.events.delete_one({"_id": ObjectId(event_id)})
    if result.deleted_count == 0:
        raise HTTPException(404, "Event not found")


@router.get("/pending")
async def list_pending_events(
    current_user: dict = Depends(require_content_admin),
):
    db = get_db()
    cursor = db.events.find({"status": "pending_approval"}).sort("created_at", -1)
    events = [serialize_event(e) async for e in cursor]
    return {"events": events, "total": len(events)}


@router.post("/{event_id}/approve")
async def approve_event(
    event_id: str,
    current_user: dict = Depends(require_content_admin),
):
    db = get_db()
    result = await db.events.update_one(
        {"_id": ObjectId(event_id)},
        {"$set": {"status": "published"}},
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Event not found")
    updated = await db.events.find_one({"_id": ObjectId(event_id)})
    return serialize_event(updated)


ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_BYTES = 8 * 1024 * 1024  # 8 MB


@router.post("/upload-image", status_code=201)
async def upload_event_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_content_admin),
):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(400, "Only JPEG, PNG, or WebP images allowed")
    data = await file.read()
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(400, "Image must be under 8 MB")
    settings = get_settings()
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in (file.filename or "") else "jpg"
    filename = f"event_{uuid.uuid4().hex}.{ext}"
    path = os.path.join(settings.upload_dir, filename)
    with open(path, "wb") as f:
        f.write(data)
    return {"url": f"/uploads/{filename}"}


@router.post("/{event_id}/rsvp")
async def rsvp(
    event_id: str,
    current_user: dict = Depends(require_member),
):
    db = get_db()
    event = await db.events.find_one({"_id": ObjectId(event_id)})
    if not event:
        raise HTTPException(404, "Event not found")

    user_id = str(current_user["_id"])
    if user_id in event.get("attendees", []):
        raise HTTPException(400, "Already RSVPed")

    if event.get("max_attendees") and len(event.get("attendees", [])) >= event["max_attendees"]:
        raise HTTPException(400, "Event is full")

    await db.events.update_one(
        {"_id": ObjectId(event_id)},
        {"$addToSet": {"attendees": user_id}},
    )
    return {"message": "RSVP confirmed"}


@router.delete("/{event_id}/rsvp")
async def cancel_rsvp(
    event_id: str,
    current_user: dict = Depends(require_member),
):
    db = get_db()
    user_id = str(current_user["_id"])
    result = await db.events.update_one(
        {"_id": ObjectId(event_id)},
        {"$pull": {"attendees": user_id}},
    )
    if result.modified_count == 0:
        raise HTTPException(400, "Not RSVPed to this event")
    return {"message": "RSVP cancelled"}
