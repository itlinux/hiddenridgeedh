from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
import os

from database import connect_db, disconnect_db, get_settings
from routes import auth, posts, events, forum, gallery, newsletter, members
from utils.limiter import limiter


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    settings = get_settings()
    os.makedirs(settings.upload_dir, exist_ok=True)
    os.makedirs(f"{settings.upload_dir}/thumbnails", exist_ok=True)
    yield
    await disconnect_db()


app = FastAPI(
    title="Hidden Ridge EDH API",
    description="Neighborhood API for hiddenridgeedh.com",
    version="1.0.0",
    lifespan=lifespan,
)

# Attach limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

settings = get_settings()

# Ensure upload directories exist before StaticFiles mount
os.makedirs(settings.upload_dir, exist_ok=True)
os.makedirs(f"{settings.upload_dir}/thumbnails", exist_ok=True)

# CORS — explicit methods & headers
origins = [
    "http://localhost:3000",
    "https://hiddenridgeedh.com",
    "https://www.hiddenridgeedh.com",
]
if settings.environment == "development":
    origins.append("http://localhost:8003")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# Static files (uploaded images)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

# Routes
app.include_router(auth.router)
app.include_router(posts.router)
app.include_router(events.router)
app.include_router(forum.router)
app.include_router(gallery.router)
app.include_router(newsletter.router)
app.include_router(members.router)


@app.get("/")
async def root():
    return {"message": "Hidden Ridge EDH API", "version": "1.0.0", "status": "online"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


# Admin bootstrap — run once to create the super admin
@app.post("/api/edh/bootstrap", include_in_schema=False)
async def bootstrap_admin(secret: str):
    """Create the initial super admin account. Disable after first use."""
    if settings.environment != "development" and secret != os.environ.get("BOOTSTRAP_SECRET"):
        from fastapi import HTTPException
        raise HTTPException(403, "Forbidden")

    from database import get_db
    from middleware.auth import hash_password
    from datetime import datetime

    db = get_db()
    existing = await db.users.find_one({"role": "super_admin"})
    if existing:
        return {"message": "Super admin already exists"}

    await db.users.insert_one({
        "email": settings.admin_email,
        "username": "remo",
        "full_name": "Remo Mattei",
        "role": "super_admin",
        "is_active": True,
        "is_approved": True,
        "password_hash": hash_password("ChangeThisPassword123!"),
        "created_at": datetime.utcnow(),
        "approved_at": datetime.utcnow(),
    })
    return {"message": "Super admin created. Change your password immediately."}
