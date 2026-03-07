from enum import Enum
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# --- Enums ---

class UserRole(str, Enum):
    PENDING = "pending"
    MEMBER = "member"
    CONTENT_ADMIN = "content_admin"
    SUPER_ADMIN = "super_admin"


# --- Auth / User ---

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    password: str
    address: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    turnstile_token: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
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
    title: str
    content: str
    category: str = "general"
    tags: list[str] = []
    cover_image: Optional[str] = None
    published: bool = True


class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[list[str]] = None
    cover_image: Optional[str] = None
    published: Optional[bool] = None


# --- Events ---

class EventCreate(BaseModel):
    title: str
    description: str
    location: str
    start_date: datetime
    end_date: Optional[datetime] = None
    max_attendees: Optional[int] = None


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    max_attendees: Optional[int] = None


# --- Forum ---

class ThreadCreate(BaseModel):
    title: str
    content: str
    category: str = "general"


class ReplyCreate(BaseModel):
    content: str


# --- Gallery ---

class GalleryItemCreate(BaseModel):
    title: str
    description: Optional[str] = None
    tags: list[str] = []


# --- Newsletter ---

class NewsletterSubscribe(BaseModel):
    email: EmailStr


class NewsletterSend(BaseModel):
    subject: str
    content: str


# --- Members ---

class RoleUpdate(BaseModel):
    role: UserRole
