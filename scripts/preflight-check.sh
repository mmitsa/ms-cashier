#!/usr/bin/env bash
#
# preflight-check.sh — validates that everything is ready for production.
# Run this BEFORE every deploy. Exits non-zero if any check fails.
#
# Usage:
#   ./scripts/preflight-check.sh                    # uses .env.production
#   ENV_FILE=.env.staging ./scripts/preflight-check.sh
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

PASS=0
FAIL=0
WARN=0

pass() { ((PASS++)); echo "  [PASS] $1"; }
fail() { ((FAIL++)); echo "  [FAIL] $1"; }
warn() { ((WARN++)); echo "  [WARN] $1"; }

echo "================================================================="
echo "  MS Cashier — Pre-Launch Preflight Check"
echo "================================================================="
echo ""

# ─── 1. ENV FILE ──────────────────────────────────────────────────
echo "[1/8] Environment file"

ENV_FILE="${ENV_FILE:-$PROJECT_DIR/.env.production}"
if [[ -f "$ENV_FILE" ]]; then
    pass "Found $ENV_FILE"
    set -a; source "$ENV_FILE"; set +a
else
    fail "Missing $ENV_FILE"
    echo "       Create it from .env.example: cp .env.example .env.production"
    exit 1
fi

# ─── 2. SECRETS STRENGTH ──────────────────────────────────────────
echo "[2/8] Secrets strength"

if [[ "${#JWT_KEY}" -ge 32 ]]; then
    pass "JWT_KEY is ${#JWT_KEY} chars (min 32)"
else
    fail "JWT_KEY is only ${#JWT_KEY} chars — must be >= 32"
fi

if [[ "$JWT_KEY" == *"MsCashierSuperSecret"* ]]; then
    fail "JWT_KEY is the dev default — MUST be rotated for production"
else
    pass "JWT_KEY is not the dev default"
fi

if [[ "${#SA_PASSWORD}" -ge 12 ]]; then
    pass "SA_PASSWORD is ${#SA_PASSWORD} chars"
else
    fail "SA_PASSWORD is too short (${#SA_PASSWORD} chars, need >= 12)"
fi

if [[ -n "${SEED_SUPERADMIN_PASSWORD:-}" ]]; then
    pass "SEED_SUPERADMIN_PASSWORD is set"
else
    if [[ "$ASPNETCORE_ENVIRONMENT" != "Development" ]]; then
        fail "SEED_SUPERADMIN_PASSWORD is empty (required outside Development)"
    else
        warn "SEED_SUPERADMIN_PASSWORD empty (OK for Development)"
    fi
fi

# ─── 3. ENVIRONMENT MODE ──────────────────────────────────────────
echo "[3/8] Environment mode"

if [[ "$ASPNETCORE_ENVIRONMENT" == "Production" ]]; then
    pass "ASPNETCORE_ENVIRONMENT=Production"
else
    warn "ASPNETCORE_ENVIRONMENT=$ASPNETCORE_ENVIRONMENT (not Production)"
fi

# ─── 4. CORS ──────────────────────────────────────────────────────
echo "[4/8] CORS configuration"

if [[ -n "${CORS_ORIGINS:-}" ]]; then
    pass "CORS_ORIGINS is set: $CORS_ORIGINS"
else
    fail "CORS_ORIGINS is empty"
fi

if echo "$CORS_ORIGINS" | grep -q 'localhost'; then
    warn "CORS_ORIGINS contains localhost — remove for production"
fi

if echo "$CORS_ORIGINS" | grep -q '\*'; then
    fail "CORS_ORIGINS contains wildcard '*' — forbidden with credentials"
fi

# ─── 5. DOMAIN ────────────────────────────────────────────────────
echo "[5/8] Domain / TLS"

if [[ -n "${DOMAIN:-}" && "$DOMAIN" != "localhost" ]]; then
    pass "DOMAIN=$DOMAIN"
else
    warn "DOMAIN=${DOMAIN:-not set} — Caddy will use self-signed cert"
fi

if [[ -f "$PROJECT_DIR/Caddyfile" ]]; then
    pass "Caddyfile exists"
else
    fail "Caddyfile missing"
fi

# ─── 6. DOCKER ────────────────────────────────────────────────────
echo "[6/8] Docker"

if docker info > /dev/null 2>&1; then
    pass "Docker daemon is running"
else
    fail "Docker is not running"
fi

if docker compose version > /dev/null 2>&1; then
    pass "docker compose available"
else
    fail "docker compose not available"
fi

# ─── 7. BUILD ─────────────────────────────────────────────────────
echo "[7/8] Build verification"

cd "$PROJECT_DIR/backend"
BUILD_OUT=$(dotnet build MsCashier.slnx -nologo -v q 2>&1)
if echo "$BUILD_OUT" | grep -qi "succeeded"; then
    pass "Backend builds (0 errors)"
else
    fail "Backend build failed"
fi

TEST_OUT=$(dotnet test MsCashier.Tests/MsCashier.Tests.csproj --nologo 2>&1)
if echo "$TEST_OUT" | grep -q "Passed!"; then
    TEST_COUNT=$(echo "$TEST_OUT" | grep "Passed:" | sed 's/.*Passed: *\([0-9]*\).*/\1/' || echo "?")
    pass "All tests pass ($TEST_COUNT)"
else
    fail "Tests failed — DO NOT DEPLOY"
fi

cd "$PROJECT_DIR/frontend"
if npm run build > /dev/null 2>&1; then
    pass "Frontend builds"
else
    fail "Frontend build failed"
fi

# ─── 8. BACKUP ────────────────────────────────────────────────────
echo "[8/8] Backup readiness"

if [[ -x "$SCRIPT_DIR/backup-db.sh" ]]; then
    pass "backup-db.sh is executable"
else
    fail "backup-db.sh missing or not executable"
fi

if [[ -x "$SCRIPT_DIR/restore-db.sh" ]]; then
    pass "restore-db.sh is executable"
else
    fail "restore-db.sh missing or not executable"
fi

if crontab -l 2>/dev/null | grep -q "mscashier-backup"; then
    pass "Backup cron job is installed"
else
    warn "Backup cron not installed — run: ./scripts/setup-cron.sh"
fi

BACKUP_DIR="$PROJECT_DIR/backups"
if [[ -d "$BACKUP_DIR" ]] && ls "$BACKUP_DIR"/mscashier-*.bak 1>/dev/null 2>&1; then
    LATEST=$(ls -1t "$BACKUP_DIR"/mscashier-*.bak | head -1)
    AGE_HOURS=$(( ($(date +%s) - $(stat -f %m "$LATEST" 2>/dev/null || stat -c %Y "$LATEST" 2>/dev/null)) / 3600 ))
    if [[ $AGE_HOURS -lt 24 ]]; then
        pass "Latest backup is ${AGE_HOURS}h old: $(basename "$LATEST")"
    else
        warn "Latest backup is ${AGE_HOURS}h old — consider a fresh one"
    fi
else
    warn "No backups found in $BACKUP_DIR"
fi

# ─── SUMMARY ──────────────────────────────────────────────────────
echo ""
echo "================================================================="
echo "  RESULTS:  ${PASS} passed  |  ${FAIL} failed  |  ${WARN} warnings"
echo "================================================================="

if [[ $FAIL -gt 0 ]]; then
    echo ""
    echo "  ❌  PREFLIGHT FAILED — fix the ${FAIL} failure(s) before deploying."
    echo ""
    exit 1
fi

if [[ $WARN -gt 0 ]]; then
    echo ""
    echo "  ⚠️  PREFLIGHT PASSED with ${WARN} warning(s) — review before deploying."
    echo ""
    exit 0
fi

echo ""
echo "  ✅  PREFLIGHT PASSED — ready to deploy."
echo ""
exit 0
