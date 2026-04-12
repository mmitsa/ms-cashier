#!/usr/bin/env bash
#
# setup-cron.sh — install (or update) the cron job for automated DB backups.
#
# Usage:
#   sudo ./scripts/setup-cron.sh              # install for current user
#   CRON_INTERVAL="0 */6 * * *" ./scripts/setup-cron.sh   # custom interval
#
# Default: every 6 hours (0 */6 * * *)
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="${SCRIPT_DIR}/backup-db.sh"
LOG_FILE="/var/log/mscashier-backup.log"
CRON_INTERVAL="${CRON_INTERVAL:-0 */6 * * *}"
CRON_TAG="# mscashier-backup"

if [[ ! -x "$BACKUP_SCRIPT" ]]; then
    echo "ERROR: $BACKUP_SCRIPT not found or not executable" >&2
    exit 1
fi

# Create log file if needed
if [[ ! -f "$LOG_FILE" ]]; then
    sudo touch "$LOG_FILE"
    sudo chmod 644 "$LOG_FILE"
    sudo chown "$(whoami)" "$LOG_FILE"
    echo "Created log file: $LOG_FILE"
fi

# Remove existing cron entry (if any) and add the new one
CRON_LINE="${CRON_INTERVAL}  ${BACKUP_SCRIPT} >> ${LOG_FILE} 2>&1  ${CRON_TAG}"

# Get current crontab (suppress "no crontab for user" message)
EXISTING=$(crontab -l 2>/dev/null || true)

# Remove old entry
FILTERED=$(echo "$EXISTING" | grep -v "$CRON_TAG" || true)

# Add new entry
NEW_CRONTAB=$(printf '%s\n%s\n' "$FILTERED" "$CRON_LINE" | sed '/^$/d')

echo "$NEW_CRONTAB" | crontab -

echo "Cron job installed:"
echo "  Schedule:  ${CRON_INTERVAL}"
echo "  Script:    ${BACKUP_SCRIPT}"
echo "  Log:       ${LOG_FILE}"
echo ""
echo "Current crontab:"
crontab -l | grep "$CRON_TAG"
echo ""
echo "To verify: tail -f $LOG_FILE"
echo "To remove: crontab -l | grep -v '$CRON_TAG' | crontab -"
