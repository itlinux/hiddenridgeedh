import httpx
from fastapi import HTTPException

from database import get_settings

VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"


async def verify_turnstile(token: str):
    """Verify a Cloudflare Turnstile token. Skips verification if no secret key is configured."""
    settings = get_settings()
    if not settings.turnstile_secret_key:
        return  # Skip in dev when not configured

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            VERIFY_URL,
            data={
                "secret": settings.turnstile_secret_key,
                "response": token,
            },
        )
        result = resp.json()

    if not result.get("success"):
        raise HTTPException(400, detail="Human verification failed. Please try again.")
