from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime
from bson import ObjectId
from typing import Optional
import re
from database import get_db
from models.schemas import PostCreate, PostUpdate, PostStatus
from middleware.auth import get_content_admin, get_approved_user

router = APIRouter(prefix="/api/posts", tags=["posts"])


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text


def serialize_post(post: dict) -> dict:
    post["id"] = str(post["_id"])
    del post["_id"]
    return post


@router.get("/")
async def list_posts(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=50),
    category: Optional[str] = None,
    tag: Optional[str] = None,
    status: Optional[PostStatus] = None,
    current_user=Depends(get_approved_user)
):
    db = get_db()
    query = {}
    
    # Non-admins can only see published posts
    user_role = current_user.get("role")
    if user_role not in ["content_admin", "super_admin"]:
        query["status"] = PostStatus.PUBLISHED
    elif status:
        query["status"] = status
    
    if category:
        query["category"] = category
    if tag:
        query["tags"] = tag

    total = await db.posts.count_documents(query)
    skip = (page - 1) * per_page
    cursor = db.posts.find(query).sort("created_at", -1).skip(skip).limit(per_page)
    posts = [serialize_post(p) async for p in cursor]

    return {
        "items": posts,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": -(-total // per_page)
    }


@router.get("/public")
async def list_public_posts(
    page: int = Query(1, ge=1),
    per_page: int = Query(6, ge=1, le=50),
    category: Optional[str] = None,
):
    """Public endpoint — published posts only, no auth required"""
    db = get_db()
    query = {"status": PostStatus.PUBLISHED}
    if category:
        query["category"] = category
    total = await db.posts.count_documents(query)
    skip = (page - 1) * per_page
    cursor = db.posts.find(query).sort("published_at", -1).skip(skip).limit(per_page)
    posts = [serialize_post(p) async for p in cursor]
    return {"items": posts, "total": total, "page": page, "per_page": per_page, "pages": -(-total // per_page)}


@router.get("/{slug}")
async def get_post(slug: str):
    db = get_db()
    post = await db.posts.find_one({"slug": slug, "status": PostStatus.PUBLISHED})
    if not post:
        raise HTTPException(404, "Post not found")
    await db.posts.update_one({"_id": post["_id"]}, {"$inc": {"views": 1}})
    post["views"] = post.get("views", 0) + 1
    return serialize_post(post)


@router.post("/", status_code=201)
async def create_post(data: PostCreate, current_user=Depends(get_content_admin)):
    db = get_db()
    base_slug = slugify(data.title)
    slug = base_slug
    counter = 1
    while await db.posts.find_one({"slug": slug}):
        slug = f"{base_slug}-{counter}"
        counter += 1

    now = datetime.utcnow()
    post_doc = {
        **data.dict(),
        "slug": slug,
        "author_id": str(current_user["_id"]),
        "author_name": current_user["full_name"],
        "views": 0,
        "created_at": now,
        "updated_at": now,
        "published_at": now if data.status == PostStatus.PUBLISHED else None,
    }
    result = await db.posts.insert_one(post_doc)
    post_doc["id"] = str(result.inserted_id)
    del post_doc["_id"]
    return post_doc


@router.put("/{post_id}")
async def update_post(post_id: str, data: PostUpdate, current_user=Depends(get_content_admin)):
    db = get_db()
    post = await db.posts.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(404, "Post not found")

    update = {k: v for k, v in data.dict().items() if v is not None}
    update["updated_at"] = datetime.utcnow()

    if data.status == PostStatus.PUBLISHED and not post.get("published_at"):
        update["published_at"] = datetime.utcnow()

    await db.posts.update_one({"_id": ObjectId(post_id)}, {"$set": update})
    updated = await db.posts.find_one({"_id": ObjectId(post_id)})
    return serialize_post(updated)


@router.delete("/{post_id}")
async def delete_post(post_id: str, current_user=Depends(get_content_admin)):
    db = get_db()
    result = await db.posts.delete_one({"_id": ObjectId(post_id)})
    if result.deleted_count == 0:
        raise HTTPException(404, "Post not found")
    return {"message": "Post deleted"}
