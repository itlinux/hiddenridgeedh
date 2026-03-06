import re
from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime
from bson import ObjectId

from database import get_db
from models.schemas import PostCreate, PostUpdate
from middleware.auth import require_content_admin

router = APIRouter(prefix="/api/posts", tags=["posts"])


def serialize_post(post: dict) -> dict:
    post["id"] = str(post["_id"])
    del post["_id"]
    return post


def slugify(title: str) -> str:
    slug = title.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-+", "-", slug).strip("-")
    return slug[:80]


@router.get("")
async def list_posts(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    category: str | None = None,
):
    db = get_db()
    query = {"published": True}
    if category:
        query["category"] = category

    total = await db.posts.count_documents(query)
    cursor = db.posts.find(query).sort("created_at", -1).skip(skip).limit(limit)
    posts = [serialize_post(p) async for p in cursor]
    return {"posts": posts, "total": total}


@router.get("/{slug}")
async def get_post(slug: str):
    db = get_db()
    post = await db.posts.find_one({"slug": slug, "published": True})
    if not post:
        raise HTTPException(404, "Post not found")
    return serialize_post(post)


@router.post("", status_code=201)
async def create_post(
    data: PostCreate,
    current_user: dict = Depends(require_content_admin),
):
    db = get_db()
    slug = slugify(data.title)

    # Ensure unique slug
    existing = await db.posts.find_one({"slug": slug})
    counter = 2
    base_slug = slug
    while existing:
        slug = f"{base_slug}-{counter}"
        existing = await db.posts.find_one({"slug": slug})
        counter += 1

    post_doc = {
        **data.model_dump(),
        "slug": slug,
        "author_id": str(current_user["_id"]),
        "author_name": current_user.get("full_name", current_user.get("username")),
        "created_at": datetime.utcnow(),
        "updated_at": None,
    }
    result = await db.posts.insert_one(post_doc)
    post_doc["id"] = str(result.inserted_id)
    return serialize_post(post_doc)


@router.put("/{post_id}")
async def update_post(
    post_id: str,
    data: PostUpdate,
    current_user: dict = Depends(require_content_admin),
):
    db = get_db()
    post = await db.posts.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(404, "Post not found")

    updates = data.model_dump(exclude_unset=True)
    if "title" in updates:
        updates["slug"] = slugify(updates["title"])
    updates["updated_at"] = datetime.utcnow()

    await db.posts.update_one({"_id": ObjectId(post_id)}, {"$set": updates})
    updated = await db.posts.find_one({"_id": ObjectId(post_id)})
    return serialize_post(updated)


@router.delete("/{post_id}", status_code=204)
async def delete_post(
    post_id: str,
    current_user: dict = Depends(require_content_admin),
):
    db = get_db()
    result = await db.posts.delete_one({"_id": ObjectId(post_id)})
    if result.deleted_count == 0:
        raise HTTPException(404, "Post not found")
