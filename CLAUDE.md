# Hidden Ridge EDH — Claude Code Context

## What This Is
A private neighborhood community portal for Hidden Ridge, El Dorado Hills, CA.
Live domain: **hiddenridgeedh.com**
Repo: git@github.com:itlinux/hiddenridgeedh.git

## Stack
| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | FastAPI (Python 3.13), Motor (async MongoDB) |
| Database | MongoDB — existing system instance, db name: `hiddenridgeedh` |
| Email | SendGrid |
| Server | Rocky Linux, Nginx (already running), systemd services |
| Auth | JWT (python-jose), bcrypt |

## Ports
- Frontend (Next.js): `3000`
- Backend (FastAPI): `8003` ← not 8000, already in use on system
- MongoDB: `27017` (system instance, do not containerize)

## Project Structure
```
hiddenridgeedh/
├── backend/
│   ├── main.py               # FastAPI entry point
│   ├── database.py           # MongoDB connection + indexes
│   ├── requirements.txt
│   ├── .env.example          # Copy to .env and fill in
│   ├── models/schemas.py     # All Pydantic models + enums
│   ├── middleware/auth.py    # JWT + role dependency guards
│   ├── routes/
│   │   ├── auth.py           # Register, login, /me
│   │   ├── posts.py          # Blog CRUD + slugs
│   │   ├── events.py         # Events + RSVP
│   │   ├── forum.py          # Threads + replies
│   │   ├── gallery.py        # Photo upload + thumbnails (Pillow)
│   │   ├── newsletter.py     # SendGrid subscribe/send
│   │   └── members.py        # Member directory + approval
│   └── utils/email.py        # SendGrid helpers + email templates
├── frontend/
│   ├── app/
│   │   ├── layout.tsx        # Root layout, AuthProvider, Toaster
│   │   ├── page.tsx          # Homepage (public)
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── admin/page.tsx    # Admin dashboard
│   ├── components/
│   │   └── layout/           # Navbar.tsx, Footer.tsx
│   ├── lib/
│   │   ├── api.ts            # Axios client + all API functions
│   │   └── auth.tsx          # AuthContext + useAuth hook
│   ├── styles/globals.css    # Tailwind + Google Fonts + custom classes
│   └── tailwind.config.js    # Design tokens
├── nginx/hiddenridgeedh.conf # Nginx reverse proxy config
└── deploy/
    ├── hredh-backend.service # systemd unit for FastAPI
    ├── hredh-frontend.service# systemd unit for Next.js
    ├── deploy.sh             # First-time deploy script
    └── update.sh             # Pull + restart script
```

## User Roles
```
super_admin   → Remo — full access, approve members, send newsletter, manage roles
content_admin → Can post blogs, create events, moderate forum
member        → Approved neighbor — forum, gallery upload, RSVP
pending       → Registered but awaiting admin approval
```

## Design System
- **Colors:** forest green `#1B2E1F` (primary), gold `#C9A84C` (accent), cream `#F5F0E8` (background)
- **Fonts:** Playfair Display (headings), Lora (body), DM Sans (UI/labels)
- **Tailwind tokens:** `forest-*`, `gold-*`, `cream-*`, `bark-*`
- **CSS classes:** `.btn-primary`, `.btn-gold`, `.btn-secondary`, `.card`, `.input-field`, `.section-label`, `.nav-link`

## What's Built
- [x] Full backend — all 7 route files, auth middleware, email utils
- [x] MongoDB indexes, Pydantic schemas, role guards
- [x] Frontend homepage, login, register, admin dashboard
- [x] Navbar, Footer, AuthContext, Axios API client
- [x] Tailwind design system, global CSS
- [x] Nginx config, systemd services, deploy scripts

## What Still Needs Building
- [ ] Blog listing page (`/blog`) + post detail (`/blog/[slug]`)
- [ ] Events calendar page (`/events`) + event detail
- [ ] Photo gallery page (`/gallery`) with lightbox
- [ ] Forum listing (`/forum`) + thread detail with replies
- [ ] Member directory (`/members`) + profile page
- [ ] Admin CRUD panels — posts, events, gallery, newsletter send
- [ ] Profile page (`/profile`) — edit own details, avatar upload
- [ ] Frontend newsletter subscribe (wire up to backend)

## Dev Commands
```bash
# Backend
cd backend
source ../venv/bin/activate
uvicorn main:app --host 127.0.0.1 --port 8003 --reload

# Frontend
cd frontend
npm run dev

# Deploy update
sudo bash deploy/update.sh
```

## Key Notes
- No Docker — everything runs natively on Rocky Linux
- MongoDB db name is `hiddenridgeedh` (auto-created on first insert)
- `host.docker.internal` not needed — backend connects to `localhost:27017` directly
- Rocky Linux uses `nginx` user, not `www-data`
- After first deploy, bootstrap super admin:
  `curl -X POST 'https://hiddenridgeedh.com/api/admin/bootstrap?secret=YOUR_SECRET'`
