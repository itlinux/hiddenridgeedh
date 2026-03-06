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
├── deploy/
│   ├── hredh-backend.service   # systemd service for FastAPI
│   ├── hredh-frontend.service  # systemd service for Next.js
│   ├── deploy.sh               # Full first-time deploy script
│   └── update.sh               # Pull & restart script
└── README.md
```

---

## Setup & Deployment

### Prerequisites (Rocky Linux)
- Python 3.13
- Node.js 20+
- MongoDB (system service, already running)
- Nginx (already configured)
- certbot

### Quick Deploy

```bash
git clone git@github.com:itlinux/hiddenridgeedh.git /var/www/hiddenridgeedh
cd /var/www/hiddenridgeedh
sudo bash deploy/deploy.sh
```

### Manual Setup

**1. Environment:**
```bash
cp backend/.env.example backend/.env
# Edit backend/.env — key values:
#   SECRET_KEY  →  openssl rand -hex 32
#   SENDGRID_API_KEY  →  from SendGrid dashboard
#   ADMIN_EMAIL →  remo@hiddenridgeedh.com
```

**2. Backend:**
```bash
python3.13 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
cd backend
uvicorn main:app --host 127.0.0.1 --port 8003 --reload
```

**3. Frontend:**
```bash
cd frontend
echo "NEXT_PUBLIC_API_URL=https://hiddenridgeedh.com" > .env.local
npm install
npm run build
node_modules/.bin/next start
```

**4. Systemd Services:**
```bash
sudo cp deploy/hredh-backend.service /etc/systemd/system/
sudo cp deploy/hredh-frontend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now hredh-backend hredh-frontend
```

**5. Nginx:**
```bash
sudo cp nginx/hiddenridgeedh.conf /etc/nginx/conf.d/
sudo nginx -t && sudo systemctl reload nginx
```

**6. SSL:**
```bash
sudo certbot --nginx -d hiddenridgeedh.com -d www.hiddenridgeedh.com
```

**7. Bootstrap Super Admin:**
```bash
curl -X POST "https://hiddenridgeedh.com/api/admin/bootstrap?secret=YOUR_SECRET"
# Then log in and change password from: ChangeThisPassword123!
```

### Updates
```bash
sudo bash deploy/update.sh
```

### Useful Commands
```bash
# Logs
journalctl -u hredh-backend -f
journalctl -u hredh-frontend -f

# Status / Restart
systemctl status hredh-backend hredh-frontend
systemctl restart hredh-backend hredh-frontend

# API Docs (dev)
http://localhost:8003/docs
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
