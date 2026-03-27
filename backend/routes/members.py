from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime
from bson import ObjectId

from database import get_db
from models.schemas import RoleUpdate, ProfileUpdate
from middleware.auth import require_member, require_super_admin, get_current_user
from utils.email import send_approval_notification

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
        member["created_at"] = user.get("created_at")
    return member


@router.get("")
async def list_members(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: str | None = None,
    current_user: dict = Depends(require_member),
):
    db = get_db()
    query = {"is_approved": True, "is_active": True}
    if search:
        query["full_name"] = {"$regex": search, "$options": "i"}

    total = await db.users.count_documents(query)
    cursor = db.users.find(query).sort("full_name", 1).skip(skip).limit(limit)
    members = [serialize_member(u) async for u in cursor]
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
