from enum import Enum
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime
import re


# --- Enums ---

class UserRole(str, Enum):
    PENDING = "pending"
    MEMBER = "member"
    CONTENT_ADMIN = "content_admin"
    SUPER_ADMIN = "super_admin"


# --- Auth / User ---

class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=30)
    full_name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=8, max_length=128)
    address: Optional[str] = Field(None, max_length=200)
    bio: Optional[str] = Field(None, max_length=500)
    phone: Optional[str] = Field(None, max_length=20)
    sms_opt_in: bool = False
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    turnstile_token: Optional[str] = None

    @field_validator("username")
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        if not re.match(r"^[a-zA-Z0-9_\-]+$", v):
            raise ValueError("Username may only contain letters, numbers, underscores, and hyphens")
        return v

    @field_validator("password")
    @classmethod
    def password_strong(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)
    turnstile_token: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserInDB(BaseModel):
    id: str
    email: str
    username: str
    full_name: str
    address: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    avatar_url: Optional[str] = None
    role: UserRole
    is_active: bool
    is_approved: bool
    created_at: datetime
    approved_at: Optional[datetime] = None
    approved_by: Optional[str] = None


# --- Posts ---

class PostCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    content: str = Field(..., min_length=10, max_length=50000)
    category: str = Field("general", max_length=50)
    tags: list[str] = Field(default_factory=list, max_length=10)
    cover_image: Optional[str] = None
    published: bool = True


class PostUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    content: Optional[str] = Field(None, min_length=10, max_length=50000)
    category: Optional[str] = Field(None, max_length=50)
    tags: Optional[list[str]] = Field(None, max_length=10)
    cover_image: Optional[str] = None
    published: Optional[bool] = None


# --- Events ---

class EventCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10, max_length=10000)
    location: str = Field(..., min_length=3, max_length=200)
    start_date: datetime
    end_date: Optional[datetime] = None
    max_attendees: Optional[int] = Field(None, ge=1, le=10000)


class EventUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = Field(None, min_length=10, max_length=10000)
    location: Optional[str] = Field(None, min_length=3, max_length=200)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    max_attendees: Optional[int] = Field(None, ge=1, le=10000)


# --- Forum ---

class ThreadCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    content: str = Field(..., min_length=5, max_length=20000)
    category: str = Field("general", max_length=50)


class ReplyCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=10000)


# --- Gallery ---

class GalleryItemCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    tags: list[str] = Field(default_factory=list, max_length=20)


# --- Newsletter ---

class NewsletterSubscribe(BaseModel):
    email: EmailStr
    turnstile_token: str | None = None


class NewsletterSend(BaseModel):
    subject: str = Field(..., min_length=3, max_length=200)
    content: str = Field(..., min_length=10, max_length=100000)


# --- Alerts ---

class AlertCreate(BaseModel):
    message: str = Field(..., min_length=5, max_length=1000)
    category: str = Field("general", max_length=50)  # general, safety, wildlife, traffic, etc.


# --- Members ---

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    bio: Optional[str] = Field(None, max_length=500)
    address: Optional[str] = Field(None, max_length=200)
    phone: Optional[str] = Field(None, max_length=20)
    sms_opt_in: Optional[bool] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class RoleUpdate(BaseModel):
    role: UserRole
