# Hidden Ridge EDH

Community portal for Hidden Ridge, El Dorado Hills.

## Stack

- **Backend**: FastAPI + MongoDB (Motor) + uvicorn
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Server**: Rocky Linux, nginx reverse proxy

---

## Deployment

```bash
# Pull latest code
cd /path/to/hiddenridgeedh
git fetch origin && git reset --hard origin/main

# Restart backend
sudo systemctl restart hredh-backend

# Rebuild frontend (required when components or NEXT_PUBLIC_* vars change)
cd frontend && rm -rf .next && npm run build && cd ..
sudo systemctl restart hredh-frontend
```

---

## Daily Operations

### News API Usage

The site aggregates local news from two providers (100 requests/day each).
Articles are cached for 6 hours to stay well under limits.

```bash
# Check API usage (last 7 days)
curl https://hiddenridgeedh.com/api/news/usage

# Check API usage (last 30 days)
curl https://hiddenridgeedh.com/api/news/usage?days=30

# Force refresh news cache (bypasses 6-hour TTL)
curl "https://hiddenridgeedh.com/api/news?refresh=true&limit=10"

# View current cached articles
curl https://hiddenridgeedh.com/api/news?limit=10
```

### MongoDB

```bash
# Connect to the database
mongosh hiddenridgeedh

# Clear news cache (forces fresh API fetch on next request)
mongosh hiddenridgeedh --eval 'db.news_cache.deleteOne({_id: "latest"})'

# View news API usage records
mongosh hiddenridgeedh --eval 'db.news_api_usage.find().sort({date: -1}).limit(10).pretty()'
```

### Services

```bash
# Check service status
sudo systemctl status hredh-backend
sudo systemctl status hredh-frontend

# View backend logs
sudo journalctl -u hredh-backend -f

# View frontend logs
sudo journalctl -u hredh-frontend -f
```

---

## Environment Variables

Backend `.env` (see `backend/.env.example` for full list):

| Variable | Description |
|---|---|
| `SECRET_KEY` | JWT signing key |
| `MONGODB_URL` | MongoDB connection string |
| `NEWS_API_KEY` | [thenewsapi.com](https://thenewsapi.com) API key (100 req/day) |
| `GNEWS_API_KEY` | [gnews.io](https://gnews.io) API key (100 req/day) |
| `SENDGRID_API_KEY` | SendGrid email API key |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret |
| `TWILIO_ACCOUNT_SID` | Twilio SMS account SID |
| `TWILIO_AUTH_TOKEN` | Twilio SMS auth token |
| `TWILIO_PHONE_NUMBER` | Twilio sender phone number |

Frontend `.env.local`:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend URL (empty in prod, `http://localhost:8003` in dev) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key |

> **Note**: `NEXT_PUBLIC_*` vars are baked in at build time. Rebuild frontend after changes.
