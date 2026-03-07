import asyncio
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
    number_map = {"zero": "0", "one": "1", "two": "2", "three": "3", "four": "4",
                  "five": "5", "six": "6", "seven": "7", "eight": "8", "nine": "9",
                  "ten": "10"}
    for word, digit in number_map.items():
        t = re.sub(rf'\b{word}\b', digit, t)
    t = re.sub(r'[^\w\s]', '', t)
    t = re.sub(r'\s+', ' ', t).strip()
    return t


def _is_similar(title: str, existing_titles: list[str], threshold: float = 0.82) -> bool:
    """Check if a title is too similar to any already-seen title."""
    for existing in existing_titles:
        if SequenceMatcher(None, title, existing).ratio() >= threshold:
            return True
    return False


def _deduplicate(articles: list[dict]) -> list[dict]:
    """Remove duplicate articles by URL and fuzzy title matching."""
    deduped = []
    seen_urls = set()
    seen_titles: list[str] = []
    for art in articles:
        url = art.get("url", "")
        norm_title = _normalize_title(art.get("title"))
        if url in seen_urls:
            continue
        if norm_title and _is_similar(norm_title, seen_titles):
            continue
        seen_urls.add(url)
        if norm_title:
            seen_titles.append(norm_title)
        deduped.append(art)
    return deduped


# ── API configs ───────────────────────────────────────────────────────────────

THENEWSAPI_URL = "https://api.thenewsapi.com/v1/news/all"
THENEWSAPI_QUERY = '"El Dorado Hills" | "Sacramento" | "Folsom" | "El Dorado County" | "EDH"'

GNEWS_URL = "https://gnews.io/api/v4/search"
GNEWS_QUERY = '"El Dorado Hills" OR "Sacramento" OR "Folsom" OR "El Dorado County"'


async def _fetch_thenewsapi(client: httpx.AsyncClient, api_key: str) -> list[dict]:
    """Fetch articles from TheNewsAPI."""
    try:
        resp = await client.get(THENEWSAPI_URL, params={
            "api_token": api_key,
            "search": THENEWSAPI_QUERY,
            "language": "en",
            "locale": "us",
            "limit": 50,
            "sort": "published_at",
        })
        resp.raise_for_status()
        data = resp.json()
        return [
            {
                "title": art.get("title"),
                "description": art.get("description"),
                "snippet": art.get("snippet"),
                "url": art.get("url", ""),
                "image_url": art.get("image_url"),
                "source": art.get("source"),
                "published_at": art.get("published_at"),
                "categories": art.get("categories", []),
            }
            for art in data.get("data", [])
        ]
    except Exception as e:
        logger.warning(f"TheNewsAPI fetch failed: {e}")
        return []


async def _fetch_gnews(client: httpx.AsyncClient, api_key: str) -> list[dict]:
    """Fetch articles from GNews."""
    try:
        resp = await client.get(GNEWS_URL, params={
            "apikey": api_key,
            "q": GNEWS_QUERY,
            "lang": "en",
            "country": "us",
            "max": 10,
            "sortby": "publishedAt",
        })
        resp.raise_for_status()
        data = resp.json()
        return [
            {
                "title": art.get("title"),
                "description": art.get("description"),
                "snippet": art.get("content", "")[:200] if art.get("content") else None,
                "url": art.get("url", ""),
                "image_url": art.get("image"),
                "source": art.get("source", {}).get("name"),
                "published_at": art.get("publishedAt"),
                "categories": [],
            }
            for art in data.get("articles", [])
        ]
    except Exception as e:
        logger.warning(f"GNews fetch failed: {e}")
        return []


# ── Router ────────────────────────────────────────────────────────────────────

router = APIRouter(prefix="/api/news", tags=["news"])
CACHE_TTL_HOURS = 6


@router.get("")
@limiter.limit("30/minute")
async def list_news(request: Request, limit: int = Query(10, ge=1, le=50)):
    """Get cached local area news articles from multiple sources."""
    settings = get_settings()

    # If no API keys configured, return empty (graceful degradation)
    if not settings.news_api_key and not settings.gnews_api_key:
        return {"articles": []}

    db = get_db()

    # Check cache
    cache = await db.news_cache.find_one({"_id": "latest"})
    if cache and cache.get("fetched_at"):
        age = datetime.utcnow() - cache["fetched_at"]
        if age < timedelta(hours=CACHE_TTL_HOURS):
            articles = cache.get("articles", [])
            return {"articles": articles[:limit]}

    # Cache is stale or missing — fetch from all configured sources concurrently
    async with httpx.AsyncClient(timeout=10.0) as client:
        tasks = []
        if settings.news_api_key:
            tasks.append(_fetch_thenewsapi(client, settings.news_api_key))
        if settings.gnews_api_key:
            tasks.append(_fetch_gnews(client, settings.gnews_api_key))

        results = await asyncio.gather(*tasks)

    # Merge all results (interleave for variety, then sort by date)
    all_articles = []
    for result in results:
        all_articles.extend(result)

    # Sort by published date (newest first)
    def _sort_key(art):
        dt = art.get("published_at") or ""
        return dt
    all_articles.sort(key=_sort_key, reverse=True)

    # Deduplicate across all sources
    articles = _deduplicate(all_articles)

    if not articles:
        # All fetches failed — return stale cache if available
        if cache:
            return {"articles": cache.get("articles", [])[:limit]}
        return {"articles": []}

    # Upsert cache
    await db.news_cache.update_one(
        {"_id": "latest"},
        {"$set": {
            "articles": articles,
            "fetched_at": datetime.utcnow(),
        }},
        upsert=True,
    )

    return {"articles": articles[:limit]}
