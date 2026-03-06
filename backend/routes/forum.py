from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime
from bson import ObjectId
from typing import Optional
from database import get_db
from models.schemas import ThreadCreate, ThreadUpdate, ReplyCreate, ForumCategory
from middleware.auth import get_approved_user, get_content_admin

router = APIRouter(prefix="/api/forum", tags=["forum"])


def serialize(doc: dict) -> dict:
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc


@router.get("/threads")
async def list_threads(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    category: Optional[ForumCategory] = None,
    current_user=Depends(get_approved_user)
):
    db = get_db()
    query = {}
    if category:
        query["category"] = category
    total = await db.forum_threads.count_documents(query)
    skip = (page - 1) * per_page
    cursor = db.forum_threads.find(query).sort([("is_pinned", -1), ("last_reply_at", -1)]).skip(skip).limit(per_page)
    threads = [serialize(t) async for t in cursor]
    return {"items": threads, "total": total, "page": page, "per_page": per_page, "pages": -(-total // per_page)}


@router.get("/threads/{thread_id}")
async def get_thread(thread_id: str, current_user=Depends(get_approved_user)):
    db = get_db()
    thread = await db.forum_threads.find_one({"_id": ObjectId(thread_id)})
    if not thread:
        raise HTTPException(404, "Thread not found")
    await db.forum_threads.update_one({"_id": ObjectId(thread_id)}, {"$inc": {"views": 1}})
    return serialize(thread)


@router.post("/threads", status_code=201)
async def create_thread(data: ThreadCreate, current_user=Depends(get_approved_user)):
    db = get_db()
    # Only content admins can pin
    is_pinned = data.is_pinned and current_user.get("role") in ["content_admin", "super_admin"]
    now = datetime.utcnow()
    doc = {
        "title": data.title,
        "content": data.content,
        "category": data.category,
        "is_pinned": is_pinned,
        "is_locked": False,
        "author_id": str(current_user["_id"]),
        "author_name": current_user["full_name"],
        "reply_count": 0,
        "views": 0,
        "last_reply_at": now,
        "last_reply_by": current_user["full_name"],
        "created_at": now,
        "updated_at": now,
    }
    result = await db.forum_threads.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    del doc["_id"]
    return doc


@router.put("/threads/{thread_id}")
async def update_thread(thread_id: str, data: ThreadUpdate, current_user=Depends(get_approved_user)):
    db = get_db()
    thread = await db.forum_threads.find_one({"_id": ObjectId(thread_id)})
    if not thread:
        raise HTTPException(404, "Thread not found")

    user_role = current_user.get("role")
    is_admin = user_role in ["content_admin", "super_admin"]
    is_author = thread["author_id"] == str(current_user["_id"])

    if not is_admin and not is_author:
        raise HTTPException(403, "Not authorized to edit this thread")

    update = {k: v for k, v in data.dict().items() if v is not None}
    update["updated_at"] = datetime.utcnow()
    await db.forum_threads.update_one({"_id": ObjectId(thread_id)}, {"$set": update})
    updated = await db.forum_threads.find_one({"_id": ObjectId(thread_id)})
    return serialize(updated)


@router.delete("/threads/{thread_id}")
async def delete_thread(thread_id: str, current_user=Depends(get_content_admin)):
    db = get_db()
    await db.forum_threads.delete_one({"_id": ObjectId(thread_id)})
    await db.forum_replies.delete_many({"thread_id": thread_id})
    return {"message": "Thread deleted"}


# ─── Replies ──────────────────────────────────────────────────────────────────

@router.get("/threads/{thread_id}/replies")
async def list_replies(
    thread_id: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user=Depends(get_approved_user)
):
    db = get_db()
    query = {"thread_id": thread_id}
    total = await db.forum_replies.count_documents(query)
    skip = (page - 1) * per_page
    cursor = db.forum_replies.find(query).sort("created_at", 1).skip(skip).limit(per_page)
    replies = [serialize(r) async for r in cursor]
    return {"items": replies, "total": total, "page": page, "per_page": per_page, "pages": -(-total // per_page)}


@router.post("/threads/{thread_id}/replies", status_code=201)
async def create_reply(thread_id: str, data: ReplyCreate, current_user=Depends(get_approved_user)):
    db = get_db()
    thread = await db.forum_threads.find_one({"_id": ObjectId(thread_id)})
    if not thread:
        raise HTTPException(404, "Thread not found")
    if thread.get("is_locked"):
        raise HTTPException(403, "Thread is locked")

    now = datetime.utcnow()
    doc = {
        "content": data.content,
        "thread_id": thread_id,
        "author_id": str(current_user["_id"]),
        "author_name": current_user["full_name"],
        "author_avatar": current_user.get("avatar_url"),
        "is_edited": False,
        "created_at": now,
        "updated_at": now,
    }
    result = await db.forum_replies.insert_one(doc)
    await db.forum_threads.update_one(
        {"_id": ObjectId(thread_id)},
        {"$inc": {"reply_count": 1}, "$set": {"last_reply_at": now, "last_reply_by": current_user["full_name"]}}
    )
    doc["id"] = str(result.inserted_id)
    del doc["_id"]
    return doc


@router.delete("/replies/{reply_id}")
async def delete_reply(reply_id: str, current_user=Depends(get_approved_user)):
    db = get_db()
    reply = await db.forum_replies.find_one({"_id": ObjectId(reply_id)})
    if not reply:
        raise HTTPException(404, "Reply not found")

    user_role = current_user.get("role")
    is_admin = user_role in ["content_admin", "super_admin"]
    is_author = reply["author_id"] == str(current_user["_id"])

    if not is_admin and not is_author:
        raise HTTPException(403, "Not authorized")

    await db.forum_replies.delete_one({"_id": ObjectId(reply_id)})
    await db.forum_threads.update_one(
        {"_id": ObjectId(reply["thread_id"])},
        {"$inc": {"reply_count": -1}}
    )
    return {"message": "Reply deleted"}
