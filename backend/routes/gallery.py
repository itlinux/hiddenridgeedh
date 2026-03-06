from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Query
from datetime import datetime
from bson import ObjectId
from typing import Optional, List
import aiofiles
import os
import uuid
from PIL import Image
import io
from database import get_db, get_settings
from middleware.auth import get_approved_user, get_content_admin

router = APIRouter(prefix="/api/gallery", tags=["gallery"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
THUMBNAIL_SIZE = (400, 300)


def serialize(doc: dict) -> dict:
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc


async def save_image(file: UploadFile, settings) -> tuple[str, str]:
    os.makedirs(settings.upload_dir, exist_ok=True)
    os.makedirs(f"{settings.upload_dir}/thumbnails", exist_ok=True)

    ext = file.filename.rsplit(".", 1)[-1].lower()
    filename = f"{uuid.uuid4()}.{ext}"
    thumb_filename = f"thumb_{filename}"

    file_path = f"{settings.upload_dir}/{filename}"
    thumb_path = f"{settings.upload_dir}/thumbnails/{thumb_filename}"

    content = await file.read()

    # Save original
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    # Create thumbnail
    img = Image.open(io.BytesIO(content))
    img.thumbnail(THUMBNAIL_SIZE, Image.LANCZOS)
    img.save(thumb_path, optimize=True, quality=85)

    return f"/uploads/{filename}", f"/uploads/thumbnails/{thumb_filename}"


@router.get("/")
async def list_gallery(
    page: int = Query(1, ge=1),
    per_page: int = Query(12, ge=1, le=50),
    tag: Optional[str] = None,
):
    db = get_db()
    query = {}
    if tag:
        query["tags"] = tag
    total = await db.gallery_items.count_documents(query)
    skip = (page - 1) * per_page
    cursor = db.gallery_items.find(query).sort("created_at", -1).skip(skip).limit(per_page)
    items = [serialize(i) async for i in cursor]
    return {"items": items, "total": total, "page": page, "per_page": per_page, "pages": -(-total // per_page)}


@router.post("/", status_code=201)
async def upload_photo(
    file: UploadFile = File(...),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),  # comma-separated
    location_hint: Optional[str] = Form(None),
    current_user=Depends(get_approved_user)
):
    settings = get_settings()

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, f"Invalid file type. Allowed: JPEG, PNG, WebP, GIF")

    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    content = await file.read()
    if len(content) > max_bytes:
        raise HTTPException(400, f"File too large. Max {settings.max_upload_size_mb}MB")
    await file.seek(0)

    image_url, thumbnail_url = await save_image(file, settings)

    db = get_db()
    tag_list = [t.strip() for t in tags.split(",")] if tags else []

    doc = {
        "title": title,
        "description": description,
        "tags": tag_list,
        "location_hint": location_hint,
        "image_url": image_url,
        "thumbnail_url": thumbnail_url,
        "uploaded_by": str(current_user["_id"]),
        "uploader_name": current_user["full_name"],
        "created_at": datetime.utcnow(),
    }
    result = await db.gallery_items.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    del doc["_id"]
    return doc


@router.delete("/{item_id}")
async def delete_photo(item_id: str, current_user=Depends(get_content_admin)):
    db = get_db()
    item = await db.gallery_items.find_one({"_id": ObjectId(item_id)})
    if not item:
        raise HTTPException(404, "Photo not found")

    settings = get_settings()
    for url in [item.get("image_url"), item.get("thumbnail_url")]:
        if url:
            try:
                os.remove(f".{url}")
            except FileNotFoundError:
                pass

    await db.gallery_items.delete_one({"_id": ObjectId(item_id)})
    return {"message": "Photo deleted"}
