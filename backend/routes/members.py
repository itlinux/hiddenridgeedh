import os
import uuid
from fastapi import APIRouter, HTTPException, Depends, Query, Request, UploadFile, File
from datetime import datetime
from bson import ObjectId
from PIL import Image

from database import get_db, get_settings
from models.schemas import RoleUpdate, ProfileUpdate
from middleware.auth import require_member, require_super_admin, get_current_user
from utils.email import send_approval_notification

AVATAR_TYPES = {"image/jpeg", "image/png", "image/webp"}
AVATAR_MAX_SIZE = 5 * 1024 * 1024  # 5MB

router = APIRouter(prefix="/api/members", tags=["members"])


def serialize_member(user: dict, include_email: bool = False) -> dict:
    member = {
        "id": str(user["_id"]),
        "username": user.get("username"),
        "full_name": user.get("full_name"),
        "bio": user.get("bio"),
        "avatar_url": user.get("avatar_url"),
        "address": user.get("address"),
        "latitude": user.get("latitude"),
        "longitude": user.get("longitude"),
        "role": user.get("role"),
    }
    if include_email:
        member["email"] = user.get("email")
        member["phone"] = user.get("phone")
        member["sms_opt_in"] = user.get("sms_opt_in", False)
        member["email_opt_in"] = user.get("email_opt_in", False)
        member["is_active"] = user.get("is_active")
        member["is_approved"] = user.get("is_approved")
        member["is_suspended"] = user.get("is_suspended", False)
        member["created_at"] = user.get("created_at")
    return member


@router.get("")
async def list_members(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: str | None = None,
    include_suspended: bool = Query(False),
    current_user: dict = Depends(require_member),
):
    db = get_db()
    is_admin = current_user.get("role") in ("super_admin", "content_admin")

    if include_suspended and is_admin:
        query: dict = {"is_approved": True}
    else:
        query = {"is_approved": True, "is_active": True, "is_suspended": {"$ne": True}}

    if search:
        query["full_name"] = {"$regex": search, "$options": "i"}

    total = await db.users.count_documents(query)
    cursor = db.users.find(query).sort("full_name", 1).skip(skip).limit(limit)
    members = [serialize_member(u, include_email=is_admin) async for u in cursor]
    return {"members": members, "total": total}


@router.get("/pending")
async def list_pending(
    current_user: dict = Depends(require_super_admin),
):
    db = get_db()
    query = {"role": "pending", "is_approved": False}
    cursor = db.users.find(query).sort("created_at", -1)
    pending = [serialize_member(u, include_email=True) async for u in cursor]
    return {"pending": pending, "total": len(pending)}


@router.get("/rejected")
async def list_rejected(
    current_user: dict = Depends(require_super_admin),
):
    db = get_db()
    query = {"role": "rejected"}
    cursor = db.users.find(query).sort("rejected_at", -1)
    rejected = [serialize_member(u, include_email=True) async for u in cursor]
    return {"rejected": rejected, "total": len(rejected)}


# ── Update own profile (any authenticated user) ─────────────────
@router.put("/me")
async def update_my_profile(
    data: ProfileUpdate,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    update_fields: dict = {}

    if data.full_name is not None:
        update_fields["full_name"] = data.full_name
    if data.username is not None:
        update_fields["username"] = data.username
    if data.bio is not None:
        update_fields["bio"] = data.bio
    if data.address is not None:
        update_fields["address"] = data.address
    if data.phone is not None:
        update_fields["phone"] = data.phone
    if data.sms_opt_in is not None:
        update_fields["sms_opt_in"] = data.sms_opt_in
    if data.email_opt_in is not None:
        update_fields["email_opt_in"] = data.email_opt_in
    if data.latitude is not None:
        update_fields["latitude"] = data.latitude
    if data.longitude is not None:
        update_fields["longitude"] = data.longitude

    if not update_fields:
        raise HTTPException(400, "No fields to update")

    update_fields["updated_at"] = datetime.utcnow()

    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": update_fields},
    )

    # Return updated user
    updated = await db.users.find_one({"_id": current_user["_id"]})
    return serialize_member(updated, include_email=True)


@router.put("/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    if file.content_type not in AVATAR_TYPES:
        raise HTTPException(400, "File type not allowed. Use JPEG, PNG, or WebP.")

    contents = await file.read()
    if len(contents) > AVATAR_MAX_SIZE:
        raise HTTPException(400, "File too large. Maximum 5MB.")

    settings = get_settings()
    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else "jpg"
    filename = f"avatar_{uuid.uuid4()}.{ext}"
    file_path = os.path.join(settings.upload_dir, filename)

    # Save and resize to 300x300
    with open(file_path, "wb") as f:
        f.write(contents)

    img = Image.open(file_path)
    img.thumbnail((300, 300))
    img.save(file_path, quality=90)

    avatar_url = f"/uploads/{filename}"

    # Delete old avatar file if exists
    db = get_db()
    old_avatar = current_user.get("avatar_url")
    if old_avatar and old_avatar.startswith("/uploads/avatar_"):
        old_path = os.path.join(settings.upload_dir, os.path.basename(old_avatar))
        if os.path.exists(old_path):
            os.remove(old_path)

    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"avatar_url": avatar_url, "updated_at": datetime.utcnow()}},
    )

    return {"avatar_url": avatar_url}


@router.get("/{user_id}")
async def get_member(
    user_id: str,
    current_user: dict = Depends(require_member),
):
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id), "is_approved": True, "is_active": True})
    if not user:
        raise HTTPException(404, "Member not found")
    return serialize_member(user, include_email=True)


@router.put("/{user_id}/approve")
async def approve_member(
    user_id: str,
    current_user: dict = Depends(require_super_admin),
):
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(404, "User not found")
    if user.get("is_approved"):
        return {"message": "User already approved"}

    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$set": {
                "is_approved": True,
                "role": "member",
                "approved_at": datetime.utcnow(),
                "approved_by": str(current_user["_id"]),
            }
        },
    )

    try:
        await send_approval_notification(user["email"], user.get("full_name", ""))
    except Exception:
        pass

    return {"message": "Member approved"}


@router.put("/{user_id}/reject")
async def reject_member(
    user_id: str,
    current_user: dict = Depends(require_super_admin),
):
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(404, "User not found")
    if user.get("is_approved"):
        raise HTTPException(400, "Cannot reject an already approved member")

    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": "rejected", "rejected_at": datetime.utcnow(), "rejected_by": str(current_user["_id"])}},
    )
    return {"message": "Member rejected"}




@router.put("/{user_id}/role")
async def update_role(
    user_id: str,
    data: RoleUpdate,
    current_user: dict = Depends(require_super_admin),
):
    if str(current_user["_id"]) == user_id:
        raise HTTPException(400, "Cannot change your own role")

    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(404, "User not found")

    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": data.role.value}},
    )
    return {"message": f"Role updated to {data.role.value}"}


@router.put("/{user_id}/deactivate")
async def deactivate_member(
    user_id: str,
    current_user: dict = Depends(require_super_admin),
):
    if str(current_user["_id"]) == user_id:
        raise HTTPException(400, "Cannot deactivate your own account")

    db = get_db()
    result = await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_active": False}},
    )
    if result.matched_count == 0:
        raise HTTPException(404, "User not found")
    return {"message": "Member deactivated"}


@router.put("/{user_id}/suspend")
async def suspend_member(
    user_id: str,
    current_user: dict = Depends(require_super_admin),
):
    if str(current_user["_id"]) == user_id:
        raise HTTPException(400, "Cannot suspend your own account")

    db = get_db()
    result = await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_active": False, "is_suspended": True, "suspended_at": datetime.utcnow(), "suspended_by": str(current_user["_id"])}},
    )
    if result.matched_count == 0:
        raise HTTPException(404, "User not found")
    return {"message": "Member suspended"}


@router.put("/{user_id}/unsuspend")
async def unsuspend_member(
    user_id: str,
    current_user: dict = Depends(require_super_admin),
):
    db = get_db()
    result = await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_active": True, "is_suspended": False}, "$unset": {"suspended_at": "", "suspended_by": ""}},
    )
    if result.matched_count == 0:
        raise HTTPException(404, "User not found")
    return {"message": "Member unsuspended"}


@router.delete("/{user_id}")
async def delete_member(
    user_id: str,
    current_user: dict = Depends(require_super_admin),
):
    """Permanently delete a member account and all associated data."""
    if str(current_user["_id"]) == user_id:
        raise HTTPException(400, "Cannot delete your own account")

    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(404, "User not found")

    # Delete the user
    await db.users.delete_one({"_id": ObjectId(user_id)})

    # Clean up related data
    await db.forum_threads.delete_many({"author_id": user_id})
    await db.forum_replies.delete_many({"author_id": user_id})

    return {"message": f"Member {user.get('full_name', '')} permanently deleted"}
