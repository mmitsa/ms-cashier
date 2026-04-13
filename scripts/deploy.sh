#!/bin/bash
set -e
echo "=== MPOS Deploy ==="
echo "Pulling latest..."
git pull origin main
echo "Building..."
docker compose build
echo "Running migrations..."
docker compose run --rm migrate
echo "Deploying..."
docker compose up -d
echo "Waiting for health..."
sleep 10
bash scripts/health-check.sh
echo "=== Deploy Complete ==="
