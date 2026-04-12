# MS Cashier — Operations Runbook

## 1. Architecture

```
                ┌─────────────────────┐
   Internet ──► │  Caddy (TLS 443)    │  Let's Encrypt or self-signed
                │  + HSTS, CSP        │
                └──────┬──────┬───────┘
                       │      │
              /api/*   │      │  /
                       ▼      ▼
                ┌──────────┐ ┌────────────┐
                │  API     │ │  Frontend  │
                │  :8080   │ │  nginx     │
                │  .NET 8  │ │  :8080     │
                └─────┬────┘ └────────────┘
                      │
                      ▼
                ┌──────────────┐
                │  SQL Server  │
                │  :1433       │
                └──────────────┘
```

Containers:
| name | role | exposed |
|---|---|---|
| `mscashier-caddy` | TLS reverse proxy (prod profile only) | 80, 443 |
| `mscashier-frontend` | nginx-unprivileged serving the React SPA | 8080 (internal) |
| `mscashier-api` | .NET 8 Web API | 8080 (internal) |
| `mscashier-migrate` | one-shot job: applies EF migrations + seeds SuperAdmin | — |
| `mscashier-db` | SQL Server 2022 | 1433 (internal) |

## 2. Daily startup / shutdown

### Local development (no TLS)
```bash
docker compose --env-file .env up -d
# Frontend:  http://localhost:3000
# API:       http://localhost:5050
# Swagger:   http://localhost:5050/swagger
```

### Production (TLS via Caddy)
```bash
DOMAIN=pos.example.com docker compose --profile prod --env-file .env up -d
# UI:        https://pos.example.com
# API:       https://pos.example.com/api/v1
```

Caddy will obtain a Let's Encrypt cert automatically the first time it sees
the domain. DNS must point at the host **before** you start.

### Shutdown (preserves data volumes)
```bash
docker compose --profile prod down
```

### Full reset (DESTROYS data — confirm before running)
```bash
docker compose --profile prod down -v
```

## 3. Backups

Two volumes carry persistent state:

| volume | what's inside | priority |
|---|---|---|
| `sqlserver-data` | the entire MsCashierDb database | **critical** |
| `caddy-data` | TLS certificates + ACME account | nice to have |

### 3.1 Hot SQL backup (recommended — backups taken without downtime)

Run a `BACKUP DATABASE` on a schedule. Inside the running container:

```bash
docker exec mscashier-db /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P "$SA_PASSWORD" -C \
  -Q "BACKUP DATABASE [MsCashierDb] TO DISK = '/var/opt/mssql/backup/mscashier-$(date +%F).bak' WITH COMPRESSION, INIT, CHECKSUM"
```

Then copy it out of the container:

```bash
docker cp mscashier-db:/var/opt/mssql/backup/mscashier-$(date +%F).bak ./backups/
```

Schedule this via cron on the host (every 6 hours is a sensible starting
point — adjust based on your acceptable RPO):

```cron
0 */6 * * *  /opt/mscashier/scripts/backup-db.sh >> /var/log/mscashier-backup.log 2>&1
```

### 3.2 Off-site retention

Push backups to durable, immutable storage. Examples:

- AWS S3: `aws s3 cp ./backups/ s3://mscashier-backups/$(date +%Y/%m/)/ --recursive`
- Backblaze B2 / Wasabi: same pattern
- rclone to any cloud: `rclone copy ./backups/ remote:mscashier/`

**Required:** the off-site copy must live on a different account/region from
the production server. Local backups don't survive disk failures or
ransomware.

### 3.3 Retention policy

| age | location | count |
|---|---|---|
| 0–24h  | local disk | every 6h ⇒ 4 |
| 1–7d   | local disk | daily ⇒ 7 |
| 1–4w   | off-site   | weekly ⇒ 4 |
| 1–12m  | off-site   | monthly ⇒ 12 |
| 1y+    | cold storage (Glacier / B2 archive) | yearly forever |

### 3.4 Restore drill

A backup that hasn't been tested isn't a backup. Once a quarter:

```bash
# 1. Stop services
docker compose --profile prod stop api frontend

# 2. Drop & recreate the database
docker exec mscashier-db /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P "$SA_PASSWORD" -C \
  -Q "DROP DATABASE IF EXISTS [MsCashierDb]"

# 3. Copy the .bak file in
docker cp ./backups/mscashier-2026-04-07.bak mscashier-db:/tmp/restore.bak

# 4. RESTORE
docker exec mscashier-db /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P "$SA_PASSWORD" -C \
  -Q "RESTORE DATABASE [MsCashierDb] FROM DISK = '/tmp/restore.bak' WITH REPLACE, STATS = 10"

# 5. Start services
docker compose --profile prod up -d api frontend

# 6. Verify
curl -fsS https://pos.example.com/health
```

Document the time it took. Your **RTO** is at most 2× that number.

## 4. Deploys

### 4.1 Standard deploy
```bash
git pull
docker compose --profile prod build api frontend
docker compose --profile prod up -d migrate    # runs to completion, exits
docker compose --profile prod up -d api frontend caddy
```

The `migrate` container runs `dotnet MsCashier.API.dll --migrate-only`. The
API container has `depends_on: migrate: service_completed_successfully`, so
migrations are guaranteed to be applied before any HTTP traffic is served.

### 4.2 Zero-downtime deploys

For true zero-downtime, run two API replicas behind Caddy and roll them one
at a time:

```bash
docker compose --profile prod up -d --no-deps --scale api=2 --no-recreate api
# wait for healthcheck on the new container
docker compose --profile prod up -d --no-deps --scale api=1 --force-recreate api
```

Migrations must be backwards-compatible across one version (additive only —
no column drops or renames). Use a two-step deploy for breaking changes:

1. Deploy code that writes to BOTH old and new columns
2. Backfill the new column from the old
3. Deploy code that reads from the new column
4. Drop the old column in a third deploy

### 4.3 Rollback

```bash
docker compose --profile prod down api frontend
docker tag mmitpos-api:previous mmitpos-api:latest
docker tag mmitpos-frontend:previous mmitpos-frontend:latest
docker compose --profile prod up -d api frontend
```

If migrations were forward-only and broke schema compatibility, restore from
the backup taken **right before the deploy** (you should always take one).

## 5. Secrets

All secrets live in `.env` (never committed). Required keys:

| key | description |
|---|---|
| `SA_PASSWORD` | SQL Server SA password (≥ 8 chars, mixed) |
| `JWT_KEY` | JWT signing key (≥ 32 chars) — `openssl rand -base64 48` |
| `JWT_ISSUER`, `JWT_AUDIENCE` | JWT iss/aud claims |
| `JWT_EXPIRY_HOURS` | access-token TTL |
| `CORS_ORIGINS` | comma-separated list, **no wildcards** |
| `SEED_SUPERADMIN_PASSWORD` | password for the seeded `admin` user (required outside Development) |
| `DOMAIN` | hostname Caddy serves (and uses for Let's Encrypt) |
| `ASPNETCORE_ENVIRONMENT` | `Development` / `Staging` / `Production` |
| `DATABASE_AUTO_MIGRATE` | `false` once you trust the standalone migrate job |

### Rotating the JWT key

Rotating the key invalidates every existing token immediately:

1. Generate a new key: `openssl rand -base64 48`
2. Update `JWT_KEY` in `.env`
3. `docker compose --profile prod up -d --no-deps api`
4. All users will be logged out and forced to re-authenticate.

### Rotating the SA password

1. Connect to the running DB and `ALTER LOGIN sa WITH PASSWORD = '<new>'`
2. Update `SA_PASSWORD` in `.env`
3. `docker compose --profile prod up -d --no-deps api migrate sqlserver`

## 6. Observability

### Logs

Structured JSON logs are emitted to:
- stdout (captured by Docker — `docker logs mscashier-api`)
- `/app/logs/mscashier-YYYY-MM-DD.log` (daily rolling, 14-day retention)

Every log line includes a `CorrelationId` field. The same ID is exposed to
clients in the `X-Correlation-Id` response header so users can quote it when
reporting issues.

```bash
# Tail and filter by correlation id
docker logs -f mscashier-api 2>&1 | grep <correlation-id>
```

### Traces / metrics

OpenTelemetry is wired in. By default it logs spans to the console in
Development. To send to a real backend, set the standard OTel env vars in
`.env` and restart the API:

```env
OTEL_EXPORTER_OTLP_ENDPOINT=https://otel-collector.example.com:4317
OTEL_EXPORTER_OTLP_PROTOCOL=grpc
```

Compatible backends: Jaeger, Tempo (Grafana), Honeycomb, Datadog, New Relic,
SigNoz, any OTLP receiver.

### Health

```bash
curl -fsS https://pos.example.com/health
# → "Healthy"
```

The endpoint runs `SELECT 1` against SQL Server. If unhealthy, the response
is HTTP 503 with the failed checks listed.

## 7. Rate limits

Hard-coded in `Program.cs`:

| policy | scope | limit | window |
|---|---|---|---|
| `auth` | `/auth/login`, `/auth/refresh`, `/otp/send`, `/otp/verify` | **10** per IP | 1 minute |
| global | every other endpoint | **200** per IP | 1 minute |

Adjust by editing `AddRateLimiter` in `Program.cs`. If you put Caddy in
front of the API, add `header_up X-Real-IP {remote_host}` so the limiter
sees the real client and not Caddy itself.

## 8. Common incidents

### "API container keeps restarting"
Check `docker logs mscashier-api`. Most likely causes:
- `ConnectionStrings__DefaultConnection` empty → fail-fast at startup
- `Jwt__Key` empty or < 32 chars → fail-fast
- SQL Server isn't ready yet → wait, it has a 30s start period

### "Login returns 429 Too Many Requests"
Rate limiter tripped. Wait 1 minute or restart the API container to clear
the in-memory windows: `docker compose restart api`.

### "Frontend says Network Error"
- Check CORS: `CORS_ORIGINS` must include the exact origin the browser uses
- Check the API is reachable from the host: `curl http://localhost:5050/health`
- Check Caddy is forwarding `/api/*`: `curl https://pos.example.com/health`

### "I lost the SuperAdmin password"
Run a one-shot SQL update:
```bash
docker exec mscashier-db /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P "$SA_PASSWORD" -C -d MsCashierDb \
  -Q "UPDATE Users SET PasswordHash = '\$2a\$11\$<bcrypt-of-new-pwd>' WHERE Username = 'admin'"
```
Generate the bcrypt hash with any bcrypt CLI; cost factor must be 11.

## 9. Tested guarantees

The test suite (`dotnet test backend/MsCashier.Tests`) currently asserts:

- **Tenant A cannot read Tenant B data** (Products, Contacts, Invoices) — even
  with explicit `Where(p => p.TenantId == tenantB)` predicates
- **TenantId is auto-assigned** on insert from the current scope
- **TenantId cannot be changed** on update (throws)
- **Saving a TenantEntity without a tenant scope throws** (sync + async)
- **Login** rejects unknown users / wrong passwords with the same generic error
- **Login** rejects users belonging to suspended / expired tenants
- **Refresh tokens rotate** on every refresh
- **Permission authorization** allows SuperAdmin past every gate, denies
  unprivileged users, and is case-insensitive

26 tests, run on every CI build. If any of them fail, **do not deploy**.
