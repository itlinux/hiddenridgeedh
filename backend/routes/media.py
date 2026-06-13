from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
import os, uuid

from database import get_db, get_settings
from middleware.auth import require_member

router = APIRouter(prefix="/api/media", tags=["media"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_BYTES = 10 * 1024 * 1024  # 10 MB


@router.post("/upload", status_code=201)
async def upload_inline_media(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_member),
):
    """Upload an image for inline use in rich text editors. Does NOT add to gallery."""
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, "Only JPEG, PNG, WebP, or GIF allowed")
    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(400, "Image must be under 10 MB")
    settings = get_settings()
    inline_dir = os.path.join(settings.upload_dir, "inline")
    os.makedirs(inline_dir, exist_ok=True)
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in (file.filename or "") else "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"
    path = os.path.join(inline_dir, filename)
    with open(path, "wb") as f:
        f.write(data)
    return {"url": f"/uploads/inline/{filename}"}
