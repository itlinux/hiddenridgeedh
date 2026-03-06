from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ─── Enums ───────────────────────────────────────────────────────────────────

class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    CONTENT_ADMIN = "content_admin"
    MEMBER = "member"
    PENDING = "pending"


class PostStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class EventStatus(str, Enum):
    UPCOMING = "upcoming"
    ONGOING = "ongoing"
    PAST = "past"
    CANCELLED = "cancelled"


# ─── User Models ──────────────────────────────────────────────────────────────

class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: str = Field(..., min_length=2, max_length=100)
    address: Optional[str] = None  # neighborhood address
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    phone: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


class UserAdminUpdate(BaseModel):
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class UserInDB(UserBase):
    id: str
    role: UserRole = UserRole.PENDING
    is_active: bool = True
    is_approved: bool = False
    created_at: datetime
    approved_at: Optional[datetime] = None
    approved_by: Optional[str] = None

    class Config:
        from_attributes = True


class UserPublic(BaseModel):
    id: str
    username: str
    full_name: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    role: UserRole
    created_at: datetime


# ─── Auth Models ──────────────────────────────────────────────────────────────

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserInDB


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ─── Post / Blog Models ───────────────────────────────────────────────────────

class PostBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    content: str = Field(..., min_length=10)
    excerpt: Optional[str] = Field(None, max_length=500)
    cover_image: Optional[str] = None
    tags: List[str] = []
    category: Optional[str] = None


class PostCreate(PostBase):
    status: PostStatus = PostStatus.DRAFT


class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    cover_image: Optional[str] = None
    tags: Optional[List[str]] = None
    category: Optional[str] = None
    status: Optional[PostStatus] = None


class PostInDB(PostBase):
    id: str
    slug: str
    status: PostStatus
    author_id: str
    author_name: str
    views: int = 0
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None


# ─── Gallery Models ───────────────────────────────────────────────────────────

class GalleryItemCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    tags: List[str] = []
    location_hint: Optional[str] = None  # e.g. "Main entrance", "Park area"


class GalleryItemInDB(GalleryItemCreate):
    id: str
    image_url: str
    thumbnail_url: str
    uploaded_by: str
    uploader_name: str
    created_at: datetime


# ─── Event Models ─────────────────────────────────────────────────────────────

class EventBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str
    location: Optional[str] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    cover_image: Optional[str] = None
    max_attendees: Optional[int] = None
    is_public: bool = True


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    cover_image: Optional[str] = None
    max_attendees: Optional[int] = None
    is_public: Optional[bool] = None
    status: Optional[EventStatus] = None


class EventInDB(EventBase):
    id: str
    status: EventStatus = EventStatus.UPCOMING
    created_by: str
    organizer_name: str
    attendees: List[str] = []
    created_at: datetime


# ─── Forum Models ─────────────────────────────────────────────────────────────

class ForumCategory(str, Enum):
    GENERAL = "general"
    ANNOUNCEMENTS = "announcements"
    SAFETY = "safety"
    RECOMMENDATIONS = "recommendations"
    MARKETPLACE = "marketplace"
    LOST_FOUND = "lost_found"
    LANDSCAPING = "landscaping"
    EVENTS = "events"


class ThreadCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    content: str = Field(..., min_length=10)
    category: ForumCategory = ForumCategory.GENERAL
    is_pinned: bool = False


class ThreadUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[ForumCategory] = None
    is_pinned: Optional[bool] = None
    is_locked: Optional[bool] = None


class ThreadInDB(ThreadCreate):
    id: str
    author_id: str
    author_name: str
    is_locked: bool = False
    reply_count: int = 0
    views: int = 0
    last_reply_at: Optional[datetime] = None
    last_reply_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ReplyCreate(BaseModel):
    content: str = Field(..., min_length=2)


class ReplyInDB(ReplyCreate):
    id: str
    thread_id: str
    author_id: str
    author_name: str
    author_avatar: Optional[str] = None
    is_edited: bool = False
    created_at: datetime
    updated_at: datetime


# ─── Newsletter Models ────────────────────────────────────────────────────────

class NewsletterSubscribe(BaseModel):
    email: EmailStr
    name: Optional[str] = None


class NewsletterSend(BaseModel):
    subject: str = Field(..., min_length=3, max_length=200)
    content: str = Field(..., min_length=10)
    preview_text: Optional[str] = None


# ─── Pagination ───────────────────────────────────────────────────────────────

class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    per_page: int
    pages: int
