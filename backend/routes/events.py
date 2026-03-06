from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime
from bson import ObjectId
from typing import Optional
from database import get_db
from models.schemas import EventCreate, EventUpdate, EventStatus
from middleware.auth import get_content_admin, get_approved_user

router = APIRouter(prefix="/api/events", tags=["events"])


def serialize_event(event: dict) -> dict:
    event["id"] = str(event["_id"])
    del event["_id"]
    return event


@router.get("/")
async def list_events(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=50),
    upcoming_only: bool = False,
):
    db = get_db()
    query = {"is_public": True}
    if upcoming_only:
        query["start_date"] = {"$gte": datetime.utcnow()}
        query["status"] = {"$ne": EventStatus.CANCELLED}

    total = await db.events.count_documents(query)
    skip = (page - 1) * per_page
    cursor = db.events.find(query).sort("start_date", 1).skip(skip).limit(per_page)
    events = [serialize_event(e) async for e in cursor]
    return {"items": events, "total": total, "page": page, "per_page": per_page, "pages": -(-total // per_page)}


@router.get("/{event_id}")
async def get_event(event_id: str):
    db = get_db()
    event = await db.events.find_one({"_id": ObjectId(event_id)})
    if not event:
        raise HTTPException(404, "Event not found")
    return serialize_event(event)


@router.post("/", status_code=201)
async def create_event(data: EventCreate, current_user=Depends(get_content_admin)):
    db = get_db()
    now = datetime.utcnow()
    event_doc = {
        **data.dict(),
        "status": EventStatus.UPCOMING,
        "created_by": str(current_user["_id"]),
        "organizer_name": current_user["full_name"],
        "attendees": [],
        "created_at": now,
    }
    result = await db.events.insert_one(event_doc)
    event_doc["id"] = str(result.inserted_id)
    del event_doc["_id"]
    return event_doc


@router.put("/{event_id}")
async def update_event(event_id: str, data: EventUpdate, current_user=Depends(get_content_admin)):
    db = get_db()
    update = {k: v for k, v in data.dict().items() if v is not None}
    await db.events.update_one({"_id": ObjectId(event_id)}, {"$set": update})
    updated = await db.events.find_one({"_id": ObjectId(event_id)})
    if not updated:
        raise HTTPException(404, "Event not found")
    return serialize_event(updated)


@router.post("/{event_id}/rsvp")
async def rsvp_event(event_id: str, current_user=Depends(get_approved_user)):
    db = get_db()
    event = await db.events.find_one({"_id": ObjectId(event_id)})
    if not event:
        raise HTTPException(404, "Event not found")

    user_id = str(current_user["_id"])
    attendees = event.get("attendees", [])
    max_att = event.get("max_attendees")

    if user_id in attendees:
        # Un-RSVP
        await db.events.update_one({"_id": ObjectId(event_id)}, {"$pull": {"attendees": user_id}})
        return {"message": "RSVP removed", "attending": False}

    if max_att and len(attendees) >= max_att:
        raise HTTPException(400, "Event is at capacity")

    await db.events.update_one({"_id": ObjectId(event_id)}, {"$addToSet": {"attendees": user_id}})
    return {"message": "RSVP confirmed", "attending": True}


@router.delete("/{event_id}")
async def delete_event(event_id: str, current_user=Depends(get_content_admin)):
    db = get_db()
    result = await db.events.delete_one({"_id": ObjectId(event_id)})
    if result.deleted_count == 0:
        raise HTTPException(404, "Event not found")
    return {"message": "Event deleted"}
