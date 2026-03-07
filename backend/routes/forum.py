from fastapi import APIRouter, HTTPException, Depends, Query, Request
from datetime import datetime
from bson import ObjectId

from database import get_db
from models.schemas import ThreadCreate, ReplyCreate, ForumCategoryCreate
from middleware.auth import require_member, require_content_admin
from utils.limiter import limiter
from utils.profanity import clean_text

router = APIRouter(prefix="/api/forum", tags=["forum"])


def serialize_category(cat: dict) -> dict:
    cat["id"] = str(cat["_id"])
    del cat["_id"]
    return cat


# Default categories seeded if collection is empty
DEFAULT_CATEGORIES = [
    {"value": "general", "label": "General", "color": "bg-forest-600 text-cream-100"},
    {"value": "recommendations", "label": "Recommendations", "color": "bg-gold-500 text-forest-800"},
    {"value": "lost-found", "label": "Lost & Found", "color": "bg-red-500 text-white"},
    {"value": "hoa", "label": "HOA", "color": "bg-bark-500 text-cream-100"},
    {"value": "events", "label": "Events", "color": "bg-forest-500 text-cream-100"},
    {"value": "safety", "label": "Safety", "color": "bg-red-600 text-white"},
]


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
@limiter.limit("10/hour")
async def create_thread(
    request: Request,
    data: ThreadCreate,
    current_user: dict = Depends(require_member),
):
    db = get_db()
    now = datetime.utcnow()
    cleaned = data.model_dump()
    cleaned["title"] = clean_text(cleaned["title"])
    cleaned["content"] = clean_text(cleaned["content"])
    thread_doc = {
        **cleaned,
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
@limiter.limit("30/hour")
async def create_reply(
    request: Request,
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
        "content": clean_text(data.content),
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


# --- Categories ---

@router.get("/categories")
async def list_categories(current_user: dict = Depends(require_member)):
    """List forum categories. Seeds defaults if none exist."""
    db = get_db()
    count = await db.forum_categories.count_documents({})
    if count == 0:
        await db.forum_categories.insert_many(
            [{**c, "created_at": datetime.utcnow()} for c in DEFAULT_CATEGORIES]
        )
    cursor = db.forum_categories.find().sort("label", 1)
    categories = [serialize_category(c) async for c in cursor]
    return {"categories": categories}


@router.post("/categories", status_code=201)
async def create_category(
    data: ForumCategoryCreate,
    current_user: dict = Depends(require_content_admin),
):
    db = get_db()
    existing = await db.forum_categories.find_one({"value": data.value})
    if existing:
        raise HTTPException(400, "Category already exists")
    doc = {**data.model_dump(), "created_at": datetime.utcnow()}
    result = await db.forum_categories.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    return serialize_category(doc)


@router.delete("/categories/{category_id}")
async def delete_category(
    category_id: str,
    current_user: dict = Depends(require_content_admin),
):
    db = get_db()
    result = await db.forum_categories.delete_one({"_id": ObjectId(category_id)})
    if result.deleted_count == 0:
        raise HTTPException(404, "Category not found")
    return {"deleted": True}
