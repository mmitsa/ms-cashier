#!/usr/bin/env bash
#
# restore-db.sh — restore MsCashierDb from a .bak file produced by
# backup-db.sh. Stops the API + frontend first so no writes happen during
# the restore, then brings them back up.
#
# Usage:
#   ./scripts/restore-db.sh ./backups/mscashier-20260407-103000.bak
#   ./scripts/restore-db.sh --latest             # restore the most recent backup
#   ./scripts/restore-db.sh --drill              # backup, drop, restore (test only — does not stop services)
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
CONTAINER="${CONTAINER:-mscashier-db}"
DB_NAME="${DB_NAME:-MsCashierDb}"

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
    echo "ERROR: SA_PASSWORD not set" >&2
    exit 1
fi

usage() {
    echo "usage: $0 <backup.bak | --latest | --drill>" >&2
    exit 1
}

[[ $# -eq 1 ]] || usage

MODE="restore"
case "$1" in
    --latest)
        BACKUP_FILE=$(ls -1t "$BACKUP_DIR"/mscashier-*.bak 2>/dev/null | head -1)
        if [[ -z "$BACKUP_FILE" ]]; then
            echo "ERROR: no backups found in $BACKUP_DIR" >&2
            exit 2
        fi
        ;;
    --drill)
        MODE="drill"
        echo "[drill] Taking a fresh backup before drilling restore..."
        "$SCRIPT_DIR/backup-db.sh"
        BACKUP_FILE=$(ls -1t "$BACKUP_DIR"/mscashier-*.bak | head -1)
        ;;
    -h|--help)
        usage
        ;;
    *)
        BACKUP_FILE="$1"
        ;;
esac

if [[ ! -f "$BACKUP_FILE" ]]; then
    echo "ERROR: backup file not found: $BACKUP_FILE" >&2
    exit 3
fi

echo "[$(date -Iseconds)] Restoring from: $BACKUP_FILE"

# In real restore mode, stop dependent services first
if [[ "$MODE" == "restore" ]]; then
    echo "[$(date -Iseconds)] Stopping api + frontend..."
    (cd "$PROJECT_DIR" && docker compose stop api frontend) || true
fi

CONTAINER_BAK="/var/opt/mssql/backup/restore-$(date +%s).bak"
docker exec "$CONTAINER" mkdir -p /var/opt/mssql/backup
docker cp "$BACKUP_FILE" "${CONTAINER}:${CONTAINER_BAK}"
# docker cp writes as root inside the container; SQL Server runs as the
# 'mssql' user and must be able to read the file.
docker exec --user root "$CONTAINER" chown mssql:root "${CONTAINER_BAK}"
docker exec --user root "$CONTAINER" chmod 640 "${CONTAINER_BAK}"

# Drop existing connections, then restore.
# WITH REPLACE allows overwriting an existing database; FORMAT/STATS print progress.
docker exec "$CONTAINER" /opt/mssql-tools18/bin/sqlcmd \
    -S localhost -U sa -P "$SA_PASSWORD" -C -b \
    -Q "
ALTER DATABASE [${DB_NAME}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
RESTORE DATABASE [${DB_NAME}] FROM DISK = '${CONTAINER_BAK}' WITH REPLACE, STATS = 10;
ALTER DATABASE [${DB_NAME}] SET MULTI_USER;
"

docker exec "$CONTAINER" rm -f "$CONTAINER_BAK"

echo "[$(date -Iseconds)] Restore OK. Verifying..."
docker exec "$CONTAINER" /opt/mssql-tools18/bin/sqlcmd \
    -S localhost -U sa -P "$SA_PASSWORD" -C -d "$DB_NAME" \
    -Q "SELECT COUNT(*) AS table_count FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE'"

if [[ "$MODE" == "restore" ]]; then
    echo "[$(date -Iseconds)] Bringing api + frontend back up..."
    (cd "$PROJECT_DIR" && docker compose --env-file .env up -d api frontend)
    echo "[$(date -Iseconds)] Waiting for API health..."
    for i in {1..30}; do
        if curl -fsS http://localhost:5050/health >/dev/null 2>&1; then
            echo "[$(date -Iseconds)] API is healthy. Restore complete."
            exit 0
        fi
        sleep 2
    done
    echo "WARNING: API did not become healthy within 60s. Investigate." >&2
    exit 4
fi

echo "[$(date -Iseconds)] Drill complete."
