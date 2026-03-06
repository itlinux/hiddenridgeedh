from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime
from bson import ObjectId
from typing import Optional
from database import get_db
from models.schemas import UserUpdate, UserAdminUpdate, UserRole
from middleware.auth import get_approved_user, get_super_admin, get_content_admin
from utils.email import send_approval_notification

router = APIRouter(prefix="/api/members", tags=["members"])


def serialize_user(user: dict) -> dict:
    user["id"] = str(user["_id"])
    del user["_id"]
    user.pop("password_hash", None)
    return user


@router.get("/")
async def list_members(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    approved_only: bool = True,
    current_user=Depends(get_approved_user)
):
    db = get_db()
    query = {"is_active": True}
    if approved_only:
        query["is_approved"] = True

    total = await db.users.count_documents(query)
    skip = (page - 1) * per_page
    cursor = db.users.find(query, {"password_hash": 0}).sort("full_name", 1).skip(skip).limit(per_page)
    members = [serialize_user(m) async for m in cursor]
    return {"items": members, "total": total, "page": page, "per_page": per_page, "pages": -(-total // per_page)}


@router.get("/pending")
async def list_pending(current_user=Depends(get_super_admin)):
    db = get_db()
    cursor = db.users.find({"is_approved": False, "is_active": True}, {"password_hash": 0}).sort("created_at", -1)
    pending = [serialize_user(u) async for u in cursor]
    return {"items": pending, "total": len(pending)}


@router.get("/{user_id}")
async def get_member(user_id: str, current_user=Depends(get_approved_user)):
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id), "is_approved": True}, {"password_hash": 0})
    if not user:
        raise HTTPException(404, "Member not found")
    return serialize_user(user)


@router.put("/me")
async def update_my_profile(data: UserUpdate, current_user=Depends(get_approved_user)):
    db = get_db()
    update = {k: v for k, v in data.dict().items() if v is not None}
    if not update:
        raise HTTPException(400, "No fields to update")
    await db.users.update_one({"_id": current_user["_id"]}, {"$set": update})
    updated = await db.users.find_one({"_id": current_user["_id"]}, {"password_hash": 0})
    return serialize_user(updated)


@router.put("/{user_id}/approve")
async def approve_member(user_id: str, current_user=Depends(get_super_admin)):
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(404, "User not found")
    if user.get("is_approved"):
        return {"message": "User already approved"}

    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {
            "is_approved": True,
            "role": UserRole.MEMBER,
            "approved_at": datetime.utcnow(),
            "approved_by": str(current_user["_id"])
        }}
    )
    # Send approval email
    try:
        await send_approval_notification(user["email"], user["full_name"])
    except Exception:
        pass

    return {"message": f"{user['full_name']} has been approved"}


@router.put("/{user_id}/role")
async def update_role(user_id: str, data: UserAdminUpdate, current_user=Depends(get_super_admin)):
    db = get_db()
    update = {k: v for k, v in data.dict().items() if v is not None}
    if not update:
        raise HTTPException(400, "No fields to update")
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update})
    updated = await db.users.find_one({"_id": ObjectId(user_id)}, {"password_hash": 0})
    if not updated:
        raise HTTPException(404, "User not found")
    return serialize_user(updated)


@router.delete("/{user_id}")
async def deactivate_member(user_id: str, current_user=Depends(get_super_admin)):
    db = get_db()
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_active": False}}
    )
    return {"message": "Member deactivated"}
