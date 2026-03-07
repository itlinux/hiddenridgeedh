import asyncio
import logging
import re
from datetime import datetime, timedelta
from difflib import SequenceMatcher
from email.utils import parsedate_to_datetime
from functools import partial
from fastapi import APIRouter, Request, Query
import feedparser
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

GOOGLE_NEWS_RSS_URLS = [
    "https://news.google.com/rss/search?q=El+Dorado+Hills+CA&hl=en-US&gl=US&ceid=US:en",
    "https://news.google.com/rss/search?q=Folsom+CA+news&hl=en-US&gl=US&ceid=US:en",
    "https://news.google.com/rss/search?q=El+Dorado+County+CA&hl=en-US&gl=US&ceid=US:en",
]


async def _track_api_call(db, provider: str, success: bool, article_count: int = 0):
    """Track an API call in the news_api_usage collection."""
    today = datetime.utcnow().strftime("%Y-%m-%d")
    await db.news_api_usage.update_one(
        {"_id": f"{provider}:{today}"},
        {
            "$inc": {
                "calls": 1,
                "success_count": 1 if success else 0,
                "fail_count": 0 if success else 1,
                "total_articles": article_count,
            },
            "$set": {
                "provider": provider,
                "date": today,
                "last_call": datetime.utcnow(),
            },
        },
        upsert=True,
    )


async def _fetch_thenewsapi(client: httpx.AsyncClient, api_key: str, db) -> list[dict]:
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
        articles = [
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
        await _track_api_call(db, "thenewsapi", True, len(articles))
        return articles
    except Exception as e:
        logger.warning(f"TheNewsAPI fetch failed: {e}")
        await _track_api_call(db, "thenewsapi", False)
        return []


async def _fetch_gnews(client: httpx.AsyncClient, api_key: str, db) -> list[dict]:
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
        articles = [
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
        await _track_api_call(db, "gnews", True, len(articles))
        return articles
    except Exception as e:
        logger.warning(f"GNews fetch failed: {e}")
        await _track_api_call(db, "gnews", False)
        return []


def _parse_rss_sync(urls: list[str]) -> list[dict]:
    """Parse multiple Google News RSS feeds (sync, runs in thread)."""
    articles = []
    for url in urls:
        try:
            feed = feedparser.parse(url)
            for entry in feed.entries[:15]:
                # Parse published date to ISO format
                published_at = None
                if hasattr(entry, "published"):
                    try:
                        dt = parsedate_to_datetime(entry.published)
                        published_at = dt.isoformat()
                    except Exception:
                        published_at = entry.published
                # Extract source from title (Google News format: "Title - Source")
                title = entry.get("title", "")
                source = None
                if " - " in title:
                    parts = title.rsplit(" - ", 1)
                    title = parts[0]
                    source = parts[1]
                articles.append({
                    "title": title,
                    "description": entry.get("summary", ""),
                    "snippet": None,
                    "url": entry.get("link", ""),
                    "image_url": None,  # Google News RSS doesn't include images
                    "source": source,
                    "published_at": published_at,
                    "categories": [],
                })
        except Exception as e:
            logger.warning(f"Google News RSS parse failed for {url}: {e}")
    return articles


async def _fetch_google_news_rss() -> list[dict]:
    """Fetch articles from Google News RSS (free, no API key, no rate limit)."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, partial(_parse_rss_sync, GOOGLE_NEWS_RSS_URLS))


# ── Router ────────────────────────────────────────────────────────────────────

router = APIRouter(prefix="/api/news", tags=["news"])
CACHE_TTL_HOURS = 6


@router.get("")
@limiter.limit("30/minute")
async def list_news(
    request: Request,
    limit: int = Query(10, ge=1, le=50),
    refresh: bool = Query(False),
):
    """Get cached local area news articles from multiple sources."""
    settings = get_settings()

    db = get_db()

    # Check cache (skip if refresh=true)
    cache = await db.news_cache.find_one({"_id": "latest"})
    if not refresh and cache and cache.get("fetched_at"):
        age = datetime.utcnow() - cache["fetched_at"]
        if age < timedelta(hours=CACHE_TTL_HOURS):
            articles = cache.get("articles", [])
            return {"articles": articles[:limit]}

    # Cache is stale or missing — fetch from all configured sources concurrently
    tasks = []
    # Google News RSS is always available (free, no key needed)
    tasks.append(_fetch_google_news_rss())

    async with httpx.AsyncClient(timeout=10.0) as client:
        if settings.news_api_key:
            tasks.append(_fetch_thenewsapi(client, settings.news_api_key, db))
        if settings.gnews_api_key:
            tasks.append(_fetch_gnews(client, settings.gnews_api_key, db))

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


@router.get("/usage")
@limiter.limit("10/minute")
async def news_api_usage(request: Request, days: int = Query(7, ge=1, le=30)):
    """Get news API usage stats for the last N days."""
    db = get_db()
    cutoff = (datetime.utcnow() - timedelta(days=days)).strftime("%Y-%m-%d")
    cursor = db.news_api_usage.find({"date": {"$gte": cutoff}}).sort("date", -1)
    records = await cursor.to_list(length=100)

    # Summarize by provider
    summary = {}
    for rec in records:
        provider = rec.get("provider", "unknown")
        if provider not in summary:
            summary[provider] = {"total_calls": 0, "successes": 0, "failures": 0,
                                 "daily_limit": 100, "articles_fetched": 0}
        summary[provider]["total_calls"] += rec.get("calls", 0)
        summary[provider]["successes"] += rec.get("success_count", 0)
        summary[provider]["failures"] += rec.get("fail_count", 0)
        summary[provider]["articles_fetched"] += rec.get("total_articles", 0)

    # Daily breakdown
    daily = []
    for rec in records:
        daily.append({
            "provider": rec.get("provider"),
            "date": rec.get("date"),
            "calls": rec.get("calls", 0),
            "successes": rec.get("success_count", 0),
            "failures": rec.get("fail_count", 0),
            "articles": rec.get("total_articles", 0),
            "last_call": rec.get("last_call", "").isoformat() if rec.get("last_call") else None,
        })

    return {"days": days, "summary": summary, "daily": daily}
