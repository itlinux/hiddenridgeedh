#!/bin/bash
# update.sh — Pull latest code and restart services
# Usage: sudo bash deploy/update.sh

set -e

APP_DIR="/var/www/hiddenridgeedh"

echo "Pulling latest code..."
cd "$APP_DIR"
git pull origin main

echo "Updating backend dependencies..."
pip3 install -r "$APP_DIR/backend/requirements.txt"

echo "Rebuilding frontend..."
cd "$APP_DIR/frontend"
npm install
npm run build

echo "Restarting services..."
systemctl restart hredh-backend hredh-frontend

echo "✅ Update complete"
systemctl status hredh-backend --no-pager
systemctl status hredh-frontend --no-pager
