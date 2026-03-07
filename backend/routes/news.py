import logging
from datetime import datetime, timedelta
from fastapi import APIRouter, Request, Query
import httpx

from database import get_db, get_settings
from utils.limiter import limiter

logger = logging.getLogger(__name__)

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
    seen_titles = set()
    for art in raw_articles:
        url = art.get("url", "")
        title = (art.get("title") or "").strip().lower()
        # Skip duplicates by URL or by identical title
        if url in seen_urls or (title and title in seen_titles):
            continue
        seen_urls.add(url)
        if title:
            seen_titles.add(title)
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
