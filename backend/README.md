# Hidden Ridge EDH — Community Portal

> Private community portal for the Hidden Ridge neighborhood, El Dorado Hills, CA

**hiddenridgeedh.com** · Next.js 14 + FastAPI + MongoDB

---

## Features

| Feature | Description |
|---|---|
| 📰 **Blog / News** | Admin-authored posts with rich text, categories, tags, cover images |
| 📸 **Photo Gallery** | Member-uploaded photos with auto-thumbnails, tags, lightbox |
| 📅 **Events Calendar** | Create events, RSVP, max attendees, status tracking |
| 💬 **Forum** | Threaded discussions, categories, pinning, locking |
| 👥 **Member Directory** | Approved neighbor profiles with addresses |
| 📧 **Newsletter** | SendGrid integration, per-subscriber unsubscribe tokens |
| 🔐 **Role-based Access** | Super Admin → Content Admin → Approved Member → Pending |

---

## Roles

| Role | Can Do |
|---|---|
| `super_admin` | Everything — approve members, manage roles, send newsletters, all CRUD |
| `content_admin` | Create/edit/delete posts, events, gallery; moderate forum; lock threads |
| `member` | Read all content, create forum threads/replies, upload gallery photos, RSVP |
| `pending` | Registered but awaiting approval — cannot access member content |

---

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend:** FastAPI (Python 3.13), Motor (async MongoDB driver)
- **Database:** MongoDB 7
- **Email:** SendGrid
- **Images:** Pillow (auto-thumbnail generation), served via Nginx
- **Auth:** JWT (python-jose), bcrypt

---

## Project Structure

```
hiddenridgeedh/
├── backend/
│   ├── main.py                 # FastAPI app entry point
│   ├── database.py             # MongoDB connection + indexes
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env.example
│   ├── models/
│   │   └── schemas.py          # All Pydantic models
│   ├── middleware/
│   │   └── auth.py             # JWT + role guards
│   ├── routes/
│   │   ├── auth.py             # Register, login, me
│   │   ├── posts.py            # Blog CRUD
│   │   ├── events.py           # Events + RSVP
│   │   ├── forum.py            # Threads + replies
│   │   ├── gallery.py          # Photo upload
│   │   ├── newsletter.py       # Subscribe + send
│   │   └── members.py          # Member directory + approvals
│   └── utils/
│       └── email.py            # SendGrid email helpers
├── frontend/
│   ├── app/
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Homepage
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── blog/               # Blog listing + post detail
│   │   ├── events/             # Events calendar + detail
│   │   ├── gallery/            # Photo gallery
│   │   ├── forum/              # Forum threads
│   │   ├── members/            # Member directory
│   │   └── admin/              # Admin dashboard
│   ├── components/
│   │   ├── layout/             # Navbar, Footer
│   │   ├── ui/                 # Reusable UI components
│   │   └── features/           # Feature-specific components
│   ├── lib/
│   │   ├── api.ts              # Axios API client
│   │   └── auth.tsx            # Auth context + hooks
│   ├── styles/globals.css
│   └── tailwind.config.js
├── nginx/
│   └── hiddenridgeedh.conf     # Nginx reverse proxy config
├── docker-compose.yml
└── README.md
```

---

## Setup

### 1. Environment Variables

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your values
```

Key variables:
- `SECRET_KEY` — generate with `openssl rand -hex 32`
- `SENDGRID_API_KEY` — from SendGrid dashboard
- `ADMIN_EMAIL` — your email for admin alerts

### 2. Development (Docker)

```bash
docker-compose up -d
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### 3. Bootstrap Super Admin

After first start, create the Remo super admin account:

```bash
curl -X POST "http://localhost:8000/api/admin/bootstrap?secret=YOUR_BOOTSTRAP_SECRET"
```

Then immediately log in and change the password from `ChangeThisPassword123!`.

### 4. Development (Manual)

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in values
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm run dev
```

---

## Production Deployment (Rocky Linux / Nginx)

### SSL Certificate
```bash
certbot --nginx -d hiddenridgeedh.com -d www.hiddenridgeedh.com
```

### Nginx
```bash
cp nginx/hiddenridgeedh.conf /etc/nginx/conf.d/
nginx -t && systemctl reload nginx
```

### Backend (systemd)
```bash
# /etc/systemd/system/hredh-backend.service
[Unit]
Description=Hidden Ridge EDH Backend
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/hiddenridgeedh/backend
ExecStart=/var/www/hiddenridgeedh/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000 --workers 2
Restart=always

[Install]
WantedBy=multi-user.target
```

### Frontend (PM2)
```bash
npm run build
pm2 start npm --name "hredh-frontend" -- start
```

---

## MongoDB Collections

| Collection | Purpose |
|---|---|
| `users` | Members, roles, approval status |
| `posts` | Blog posts with slugs |
| `events` | Community events + attendees |
| `forum_threads` | Forum discussions |
| `forum_replies` | Thread replies |
| `gallery_items` | Photo metadata |
| `newsletter_subscribers` | Email list with unsubscribe tokens |
| `newsletter_sends` | Send history / audit log |

---

## Design System

Colors defined in `tailwind.config.js`:

| Token | Hex | Usage |
|---|---|---|
| `forest-800` | `#1B2E1F` | Primary backgrounds, headers |
| `gold-400` | `#C9A84C` | Accents, CTAs, highlights |
| `cream-100` | `#F5F0E8` | Page backgrounds, light surfaces |
| `bark-400` | `#8B7355` | Muted text, section labels |

Fonts: **Playfair Display** (headings) · **Lora** (body) · **DM Sans** (UI/labels)

---

*Built for Vonnie & Remo — Hidden Ridge EDH, El Dorado Hills, CA*
