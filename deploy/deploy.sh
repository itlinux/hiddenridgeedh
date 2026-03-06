#!/bin/bash
# deploy.sh — Hidden Ridge EDH first-time deployment on Rocky Linux
# Assumes: nginx, MongoDB, certbot already installed and running
# Usage: sudo bash deploy/deploy.sh

set -e

APP_DIR="/var/www/hiddenridgeedh"
REPO="git@github.com:itlinux/hiddenridgeedh.git"
DOMAIN="hiddenridgeedh.com"
APP_USER="nginx"   # Rocky Linux nginx runs as 'nginx', not 'www-data'

echo "═══════════════════════════════════════════"
echo "  Hidden Ridge EDH — Deployment Script"
echo "═══════════════════════════════════════════"

# ─── 1. Python dependencies ───────────────────────────────────────────────────
echo "[1/6] Installing Python 3.13 dependencies..."
dnf install -y python3.13 python3.13-pip python3.13-devel \
    libjpeg-turbo-devel zlib-devel file-libs

# ─── 2. Clone or pull repo ────────────────────────────────────────────────────
echo "[2/6] Cloning repository..."
if [ -d "$APP_DIR/.git" ]; then
    echo "Repo already exists, pulling latest..."
    cd "$APP_DIR"
    git pull origin main
else
    git clone "$REPO" "$APP_DIR"
    cd "$APP_DIR"
fi

# ─── 3. Backend setup ─────────────────────────────────────────────────────────
echo "[3/6] Setting up Python backend..."

python3.13 -m venv "$APP_DIR/venv"
source "$APP_DIR/venv/bin/activate"
pip install --upgrade pip
pip install -r "$APP_DIR/backend/requirements.txt"

if [ ! -f "$APP_DIR/backend/.env" ]; then
    cp "$APP_DIR/backend/.env.example" "$APP_DIR/backend/.env"
    echo ""
    echo "⚠️  Created backend/.env — EDIT IT before continuing:"
    echo "    vi $APP_DIR/backend/.env"
    echo ""
    read -p "Press ENTER once you've saved your .env file..."
fi

mkdir -p "$APP_DIR/backend/uploads/thumbnails"

# ─── 4. Frontend setup ────────────────────────────────────────────────────────
echo "[4/6] Building Next.js frontend..."
cd "$APP_DIR/frontend"

if [ ! -f .env.local ]; then
    echo "NEXT_PUBLIC_API_URL=https://$DOMAIN" > .env.local
fi

npm install
npm run build

# ─── 5. Nginx config ──────────────────────────────────────────────────────────
echo "[5/6] Installing Nginx config..."

if [ -f /etc/nginx/conf.d/hiddenridgeedh.conf ]; then
    cp /etc/nginx/conf.d/hiddenridgeedh.conf /etc/nginx/conf.d/hiddenridgeedh.conf.bak
fi

cp "$APP_DIR/nginx/hiddenridgeedh.conf" /etc/nginx/conf.d/hiddenridgeedh.conf
chown -R $APP_USER:$APP_USER "$APP_DIR"

nginx -t && systemctl reload nginx
echo "Nginx reloaded"

# ─── 6. Systemd services ──────────────────────────────────────────────────────
echo "[6/6] Installing systemd services..."

sed -i "s/User=www-data/User=$APP_USER/" "$APP_DIR/deploy/hredh-backend.service"
sed -i "s/Group=www-data/Group=$APP_USER/" "$APP_DIR/deploy/hredh-backend.service"
sed -i "s/User=www-data/User=$APP_USER/" "$APP_DIR/deploy/hredh-frontend.service"
sed -i "s/Group=www-data/Group=$APP_USER/" "$APP_DIR/deploy/hredh-frontend.service"

cp "$APP_DIR/deploy/hredh-backend.service" /etc/systemd/system/
cp "$APP_DIR/deploy/hredh-frontend.service" /etc/systemd/system/

systemctl daemon-reload
systemctl enable hredh-backend hredh-frontend
systemctl restart hredh-backend hredh-frontend

echo ""
echo "✅ Deployment complete!"
echo ""
systemctl status hredh-backend --no-pager -l
systemctl status hredh-frontend --no-pager -l
echo ""
echo "Logs:  journalctl -u hredh-backend -f"
echo ""
echo "Bootstrap super admin:"
echo "  curl -X POST 'https://$DOMAIN/api/admin/bootstrap?secret=YOUR_SECRET'"
