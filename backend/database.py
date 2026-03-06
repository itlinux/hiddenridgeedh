from motor.motor_asyncio import AsyncIOMotorClient
from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db: str = "hiddenridgeedh"
    secret_key: str = "change-this-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    sendgrid_api_key: str = ""
    from_email: str = "noreply@hiddenridgeedh.com"
    from_name: str = "Hidden Ridge EDH"
    app_url: str = "https://hiddenridgeedh.com"
    admin_email: str = ""
    environment: str = "development"
    upload_dir: str = "./uploads"
    max_upload_size_mb: int = 10

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()


class Database:
    client: AsyncIOMotorClient = None
    db = None


db_instance = Database()


async def connect_db():
    settings = get_settings()
    db_instance.client = AsyncIOMotorClient(settings.mongodb_url)
    db_instance.db = db_instance.client[settings.mongodb_db]
    # Create indexes
    await create_indexes()
    print(f"Connected to MongoDB: {settings.mongodb_db}")


async def disconnect_db():
    if db_instance.client:
        db_instance.client.close()


async def create_indexes():
    db = db_instance.db
    await db.users.create_index("email", unique=True)
    await db.users.create_index("username", unique=True)
    await db.posts.create_index([("slug", 1)], unique=True)
    await db.posts.create_index([("status", 1), ("created_at", -1)])
    await db.forum_threads.create_index([("category", 1), ("created_at", -1)])
    await db.events.create_index([("start_date", 1)])
    await db.newsletter_subscribers.create_index("email", unique=True)
    await db.gallery_items.create_index([("created_at", -1)])


def get_db():
    return db_instance.db
