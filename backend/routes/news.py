import logging
import re
from datetime import datetime, timedelta
from difflib import SequenceMatcher
from fastapi import APIRouter, Request, Query
import httpx

from database import get_db, get_settings
from utils.limiter import limiter

logger = logging.getLogger(__name__)


def _normalize_title(title: str) -> str:
    """Normalize a title for fuzzy comparison: lowercase, strip punctuation,
    collapse whitespace, and convert written numbers to digits."""
    t = (title or "").strip().lower()
    # Replace common written numbers with digits
    number_map = {"zero": "0", "one": "1", "two": "2", "three": "3", "four": "4",
                  "five": "5", "six": "6", "seven": "7", "eight": "8", "nine": "9",
                  "ten": "10"}
    for word, digit in number_map.items():
        t = re.sub(rf'\b{word}\b', digit, t)
    # Strip punctuation and collapse whitespace
    t = re.sub(r'[^\w\s]', '', t)
    t = re.sub(r'\s+', ' ', t).strip()
    return t


def _is_similar(title: str, existing_titles: list[str], threshold: float = 0.82) -> bool:
    """Check if a title is too similar to any already-seen title."""
    for existing in existing_titles:
        if SequenceMatcher(None, title, existing).ratio() >= threshold:
            return True
    return False

router = APIRouter(prefix="/api/news", tags=["news"])

CACHE_TTL_HOURS = 6
SEARCH_QUERY = '"El Dorado Hills" | "Sacramento" | "Folsom" | "El Dorado County" | "EDH"'
API_URL = "https://api.thenewsapi.com/v1/news/all"


@router.get("")
@limiter.limit("30/minute")
async def list_news(request: Request, limit: int = Query(10, ge=1, le=50)):
    """Get cached local area news articles from TheNewsAPI."""
    settings = get_settings()

    # If no API key configured, return empty (graceful degradation)
    if not settings.news_api_key:
        return {"articles": []}

    db = get_db()

    # Check cache
    cache = await db.news_cache.find_one({"_id": "latest"})
    if cache and cache.get("fetched_at"):
        age = datetime.utcnow() - cache["fetched_at"]
        if age < timedelta(hours=CACHE_TTL_HOURS):
            articles = cache.get("articles", [])
            return {"articles": articles[:limit]}

    # Cache is stale or missing — fetch from API
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(API_URL, params={
                "api_token": settings.news_api_key,
                "search": SEARCH_QUERY,
                "language": "en",
                "locale": "us",
                "limit": 50,
                "sort": "published_at",
            })
            resp.raise_for_status()
            data = resp.json()
    except Exception as e:
        logger.warning(f"TheNewsAPI fetch failed: {e}")
        # Return stale cache if available, otherwise empty
        if cache:
            return {"articles": cache.get("articles", [])[:limit]}
        return {"articles": []}

    # Extract, normalize, and deduplicate articles
    raw_articles = data.get("data", [])
    articles = []
    seen_urls = set()
    seen_titles: list[str] = []
    for art in raw_articles:
        url = art.get("url", "")
        norm_title = _normalize_title(art.get("title"))
        # Skip duplicates by URL or by fuzzy title match
        if url in seen_urls:
            continue
        if norm_title and _is_similar(norm_title, seen_titles):
            continue
        seen_urls.add(url)
        if norm_title:
            seen_titles.append(norm_title)
        articles.append({
            "title": art.get("title"),
            "description": art.get("description"),
            "snippet": art.get("snippet"),
            "url": url,
            "image_url": art.get("image_url"),
            "source": art.get("source"),
            "published_at": art.get("published_at"),
            "categories": art.get("categories", []),
        })

    # Upsert cache (single document with _id "latest")
    await db.news_cache.update_one(
        {"_id": "latest"},
        {"$set": {
            "articles": articles,
            "fetched_at": datetime.utcnow(),
        }},
        upsert=True,
    )

    return {"articles": articles[:limit]}
