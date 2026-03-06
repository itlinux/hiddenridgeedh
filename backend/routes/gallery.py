import os
import uuid
from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File, Form
from datetime import datetime
from bson import ObjectId
from PIL import Image

from database import get_db, get_settings
from middleware.auth import require_member, require_content_admin, get_current_user

router = APIRouter(prefix="/api/gallery", tags=["gallery"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def serialize_item(item: dict) -> dict:
    item["id"] = str(item["_id"])
    del item["_id"]
    return item


@router.get("")
async def list_gallery(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    tag: str | None = None,
):
    db = get_db()
    query = {}
    if tag:
        query["tags"] = tag

    total = await db.gallery.count_documents(query)
    cursor = db.gallery.find(query).sort("created_at", -1).skip(skip).limit(limit)
    items = [serialize_item(i) async for i in cursor]
    return {"items": items, "total": total}


@router.post("/upload", status_code=201)
async def upload_photo(
    file: UploadFile = File(...),
    title: str = Form(...),
    description: str = Form(""),
    tags: str = Form(""),
    current_user: dict = Depends(require_member),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, "File type not allowed. Use JPEG, PNG, WebP, or GIF.")

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(400, "File too large. Maximum 10MB.")

    settings = get_settings()
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    file_path = os.path.join(settings.upload_dir, filename)
    thumb_path = os.path.join(settings.upload_dir, "thumbnails", filename)

    with open(file_path, "wb") as f:
        f.write(contents)

    img = Image.open(file_path)
    img.thumbnail((300, 300))
    img.save(thumb_path, quality=85)

    tag_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else []

    db = get_db()
    item_doc = {
        "title": title,
        "description": description,
        "tags": tag_list,
        "image_url": f"/uploads/{filename}",
        "thumbnail_url": f"/uploads/thumbnails/{filename}",
        "uploaded_by": str(current_user["_id"]),
        "uploader_name": current_user.get("full_name", current_user.get("username")),
        "created_at": datetime.utcnow(),
    }
    result = await db.gallery.insert_one(item_doc)
    item_doc["id"] = str(result.inserted_id)
    return serialize_item(item_doc)


@router.delete("/{item_id}", status_code=204)
async def delete_photo(
    item_id: str,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    item = await db.gallery.find_one({"_id": ObjectId(item_id)})
    if not item:
        raise HTTPException(404, "Gallery item not found")

    is_owner = item.get("uploaded_by") == str(current_user["_id"])
    is_admin = current_user.get("role") in ("content_admin", "super_admin")
    if not is_owner and not is_admin:
        raise HTTPException(403, "Not authorized to delete this item")

    settings = get_settings()
    for url_field in ("image_url", "thumbnail_url"):
        url = item.get(url_field, "")
        if url:
            path = os.path.join(settings.upload_dir, url.replace("/uploads/", "", 1))
            if os.path.exists(path):
                os.remove(path)

    await db.gallery.delete_one({"_id": ObjectId(item_id)})
