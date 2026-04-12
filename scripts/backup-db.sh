#!/usr/bin/env bash
#
# backup-db.sh — hot backup of MsCashierDb out of the running SQL Server
# container, with optional off-site upload via rclone.
#
# Usage:
#   ./scripts/backup-db.sh                       # local backup only
#   RCLONE_REMOTE=b2:mscashier ./scripts/backup-db.sh   # also push off-site
#
# Cron example (every 6 hours):
#   0 */6 * * *  /opt/mscashier/scripts/backup-db.sh >> /var/log/mscashier-backup.log 2>&1
#
# Requirements:
#   - The mscashier-db container must be running
#   - SA_PASSWORD must be set in the parent .env (auto-loaded below)
#   - For off-site: rclone installed and a remote configured
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
CONTAINER="${CONTAINER:-mscashier-db}"
DB_NAME="${DB_NAME:-MsCashierDb}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

# Load .env (SA_PASSWORD)
# Load env file: prefer .env.production, fall back to .env
ENV_FILE="${ENV_FILE:-}"
if [[ -z "$ENV_FILE" ]]; then
    if [[ -f "$PROJECT_DIR/.env.production" ]]; then
        ENV_FILE="$PROJECT_DIR/.env.production"
    elif [[ -f "$PROJECT_DIR/.env" ]]; then
        ENV_FILE="$PROJECT_DIR/.env"
    fi
fi
if [[ -n "$ENV_FILE" && -f "$ENV_FILE" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "$ENV_FILE"
    set +a
fi

if [[ -z "${SA_PASSWORD:-}" ]]; then
    echo "ERROR: SA_PASSWORD not set (check .env or .env.production)" >&2
    exit 1
fi

# Verify the container is up
if ! docker ps --filter "name=^${CONTAINER}\$" --format '{{.Names}}' | grep -q "^${CONTAINER}\$"; then
    echo "ERROR: container '${CONTAINER}' is not running" >&2
    exit 2
fi

mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_FILE="mscashier-${TIMESTAMP}.bak"
CONTAINER_PATH="/var/opt/mssql/backup/${BACKUP_FILE}"
HOST_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

echo "[$(date -Iseconds)] Starting backup → ${BACKUP_FILE}"

# Make sure /var/opt/mssql/backup exists inside the container
docker exec "$CONTAINER" mkdir -p /var/opt/mssql/backup

# Run BACKUP DATABASE inside the container
docker exec "$CONTAINER" /opt/mssql-tools18/bin/sqlcmd \
    -S localhost -U sa -P "$SA_PASSWORD" -C \
    -Q "BACKUP DATABASE [${DB_NAME}] TO DISK = '${CONTAINER_PATH}' WITH COMPRESSION, INIT, CHECKSUM, FORMAT" \
    > /dev/null

# Copy out of the container
docker cp "${CONTAINER}:${CONTAINER_PATH}" "$HOST_PATH"

# Drop the in-container copy so we don't fill /var/opt/mssql
docker exec "$CONTAINER" rm -f "$CONTAINER_PATH"

SIZE=$(du -h "$HOST_PATH" | cut -f1)
echo "[$(date -Iseconds)] Backup written: ${HOST_PATH} (${SIZE})"

# Retention: delete local backups older than RETENTION_DAYS
find "$BACKUP_DIR" -name 'mscashier-*.bak' -type f -mtime "+${RETENTION_DAYS}" -delete -print \
    | sed 's/^/[deleted old] /'

# Off-site upload (optional)
if [[ -n "${RCLONE_REMOTE:-}" ]]; then
    if command -v rclone >/dev/null 2>&1; then
        echo "[$(date -Iseconds)] Uploading to ${RCLONE_REMOTE}..."
        rclone copy "$HOST_PATH" "$RCLONE_REMOTE/$(date +%Y/%m)/" --quiet
        echo "[$(date -Iseconds)] Off-site upload OK"
    else
        echo "WARNING: RCLONE_REMOTE set but rclone is not installed" >&2
    fi
fi

echo "[$(date -Iseconds)] DONE"
