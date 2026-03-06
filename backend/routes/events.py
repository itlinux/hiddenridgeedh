from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime
from bson import ObjectId

from database import get_db
from models.schemas import EventCreate, EventUpdate
from middleware.auth import require_member, require_content_admin

router = APIRouter(prefix="/api/events", tags=["events"])


def serialize_event(event: dict) -> dict:
    event["id"] = str(event["_id"])
    del event["_id"]
    event["attendee_count"] = len(event.get("attendees", []))
    return event


@router.get("")
async def list_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    upcoming: bool = True,
):
    db = get_db()
    query = {}
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
    event_doc["id"] = str(result.inserted_id)
    return serialize_event(event_doc)


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
