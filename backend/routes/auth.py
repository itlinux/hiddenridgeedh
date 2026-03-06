from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime
from bson import ObjectId
from database import get_db, get_settings
from models.schemas import UserCreate, UserInDB, Token, LoginRequest, UserRole
from middleware.auth import hash_password, verify_password, create_access_token, get_current_user
from utils.email import send_pending_notification, send_admin_new_user_alert

router = APIRouter(prefix="/api/auth", tags=["auth"])


def serialize_user(user: dict) -> dict:
    user["id"] = str(user["_id"])
    del user["_id"]
    user.pop("password_hash", None)
    return user


@router.post("/register", status_code=201)
async def register(data: UserCreate):
    db = get_db()
    settings = get_settings()

    existing = await db.users.find_one({"$or": [{"email": data.email}, {"username": data.username}]})
    if existing:
        field = "email" if existing.get("email") == data.email else "username"
        raise HTTPException(400, detail=f"That {field} is already registered.")

    user_doc = {
        "email": data.email,
        "username": data.username,
        "full_name": data.full_name,
        "address": data.address,
        "bio": data.bio,
        "phone": data.phone,
        "avatar_url": None,
        "password_hash": hash_password(data.password),
        "role": UserRole.PENDING,
        "is_active": True,
        "is_approved": False,
        "created_at": datetime.utcnow(),
        "approved_at": None,
        "approved_by": None,
    }

    result = await db.users.insert_one(user_doc)
    user_doc["id"] = str(result.inserted_id)

    # Email notifications
    try:
        await send_pending_notification(data.email, data.full_name)
        if settings.admin_email:
            await send_admin_new_user_alert(
                settings.admin_email, data.full_name, data.email, settings.app_url
            )
    except Exception:
        pass  # Don't fail registration if email fails

    return {"message": "Registration successful. Your account is pending approval.", "user_id": user_doc["id"]}


@router.post("/login", response_model=Token)
async def login(data: LoginRequest):
    db = get_db()
    user = await db.users.find_one({"email": data.email})

    if not user or not verify_password(data.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.get("is_active"):
        raise HTTPException(status_code=400, detail="Account deactivated")

    token = create_access_token({"sub": str(user["_id"])})
    return {"access_token": token, "token_type": "bearer", "user": serialize_user(user)}


@router.get("/me")
async def get_me(current_user=Depends(get_current_user)):
    return serialize_user(current_user)


@router.post("/logout")
async def logout():
    # JWT is stateless; client discards token
    return {"message": "Logged out"}
