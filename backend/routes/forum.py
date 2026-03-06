from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime
from bson import ObjectId

from database import get_db
from models.schemas import ThreadCreate, ReplyCreate
from middleware.auth import require_member, require_content_admin

router = APIRouter(prefix="/api/forum", tags=["forum"])


def serialize_thread(thread: dict) -> dict:
    thread["id"] = str(thread["_id"])
    del thread["_id"]
    return thread


def serialize_reply(reply: dict) -> dict:
    reply["id"] = str(reply["_id"])
    del reply["_id"]
    return reply


@router.get("/threads")
async def list_threads(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    category: str | None = None,
    current_user: dict = Depends(require_member),
):
    db = get_db()
    query = {}
    if category:
        query["category"] = category

    total = await db.forum_threads.count_documents(query)
    cursor = (
        db.forum_threads.find(query)
        .sort([("pinned", -1), ("last_activity", -1)])
        .skip(skip)
        .limit(limit)
    )
    threads = [serialize_thread(t) async for t in cursor]
    return {"threads": threads, "total": total}


@router.get("/threads/{thread_id}")
async def get_thread(
    thread_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(require_member),
):
    db = get_db()
    thread = await db.forum_threads.find_one({"_id": ObjectId(thread_id)})
    if not thread:
        raise HTTPException(404, "Thread not found")

    cursor = (
        db.forum_replies.find({"thread_id": thread_id})
        .sort("created_at", 1)
        .skip(skip)
        .limit(limit)
    )
    replies = [serialize_reply(r) async for r in cursor]
    reply_total = await db.forum_replies.count_documents({"thread_id": thread_id})

    result = serialize_thread(thread)
    result["replies"] = replies
    result["reply_total"] = reply_total
    return result


@router.post("/threads", status_code=201)
async def create_thread(
    data: ThreadCreate,
    current_user: dict = Depends(require_member),
):
    db = get_db()
    now = datetime.utcnow()
    thread_doc = {
        **data.model_dump(),
        "author_id": str(current_user["_id"]),
        "author_name": current_user.get("full_name", current_user.get("username")),
        "pinned": False,
        "locked": False,
        "reply_count": 0,
        "last_activity": now,
        "created_at": now,
    }
    result = await db.forum_threads.insert_one(thread_doc)
    thread_doc["id"] = str(result.inserted_id)
    return serialize_thread(thread_doc)


@router.post("/threads/{thread_id}/replies", status_code=201)
async def create_reply(
    thread_id: str,
    data: ReplyCreate,
    current_user: dict = Depends(require_member),
):
    db = get_db()
    thread = await db.forum_threads.find_one({"_id": ObjectId(thread_id)})
    if not thread:
        raise HTTPException(404, "Thread not found")
    if thread.get("locked"):
        raise HTTPException(403, "Thread is locked")

    now = datetime.utcnow()
    reply_doc = {
        "thread_id": thread_id,
        "content": data.content,
        "author_id": str(current_user["_id"]),
        "author_name": current_user.get("full_name", current_user.get("username")),
        "created_at": now,
    }
    result = await db.forum_replies.insert_one(reply_doc)

    await db.forum_threads.update_one(
        {"_id": ObjectId(thread_id)},
        {"$inc": {"reply_count": 1}, "$set": {"last_activity": now}},
    )

    reply_doc["id"] = str(result.inserted_id)
    return serialize_reply(reply_doc)


@router.put("/threads/{thread_id}/pin")
async def toggle_pin(
    thread_id: str,
    current_user: dict = Depends(require_content_admin),
):
    db = get_db()
    thread = await db.forum_threads.find_one({"_id": ObjectId(thread_id)})
    if not thread:
        raise HTTPException(404, "Thread not found")

    new_value = not thread.get("pinned", False)
    await db.forum_threads.update_one(
        {"_id": ObjectId(thread_id)}, {"$set": {"pinned": new_value}}
    )
    return {"pinned": new_value}


@router.put("/threads/{thread_id}/lock")
async def toggle_lock(
    thread_id: str,
    current_user: dict = Depends(require_content_admin),
):
    db = get_db()
    thread = await db.forum_threads.find_one({"_id": ObjectId(thread_id)})
    if not thread:
        raise HTTPException(404, "Thread not found")

    new_value = not thread.get("locked", False)
    await db.forum_threads.update_one(
        {"_id": ObjectId(thread_id)}, {"$set": {"locked": new_value}}
    )
    return {"locked": new_value}
