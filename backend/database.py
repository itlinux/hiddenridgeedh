from pydantic_settings import BaseSettings, SettingsConfigDict
from motor.motor_asyncio import AsyncIOMotorClient

_settings = None
_client = None
_db = None


class Settings(BaseSettings):
    secret_key: str = "dev-secret-change-in-prod"
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db: str = "hiddenridgeedh"
    sendgrid_api_key: str = ""
    email_provider: str = "sendgrid"
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_use_tls: bool = True
    from_email: str = "noreply@hiddenridgeedh.com"
    from_name: str = "Hidden Ridge EDH"
    app_url: str = "http://localhost:3000"
    admin_email: str = ""
    environment: str = "development"
    upload_dir: str = "./uploads"
    bootstrap_secret: str = ""
    turnstile_secret_key: str = ""
    login_max_attempts: int = 5
    login_block_minutes: int = 15
    login_whitelist_ips: str = ""  # comma-separated IPs e.g. "1.2.3.4,5.6.7.8"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings


async def connect_db():
    global _client, _db, _settings
    _settings = Settings()
    _client = AsyncIOMotorClient(_settings.mongodb_url)
    _db = _client[_settings.mongodb_db]
    await _create_indexes()


async def disconnect_db():
    global _client
    if _client:
        _client.close()


def get_db():
    return _db


async def _create_indexes():
    await _db.users.create_index("email", unique=True)
    await _db.users.create_index("username", unique=True)
    await _db.posts.create_index("slug", unique=True)
    await _db.posts.create_index("created_at")
    await _db.events.create_index("start_date")
    await _db.forum_threads.create_index("created_at")
    await _db.forum_threads.create_index("last_activity")
    await _db.forum_replies.create_index("thread_id")
    await _db.gallery.create_index("created_at")
    await _db.newsletter_subscribers.create_index("email", unique=True)
