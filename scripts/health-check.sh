#!/bin/bash
echo "=== MPOS Health Check ==="
echo ""

# API
API=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5050/health 2>/dev/null)
echo "API:        $([ "$API" = "200" ] && echo "✅ Healthy" || echo "❌ Down ($API)")"

# Frontend
FE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)
echo "Frontend:   $([ "$FE" = "200" ] && echo "✅ Healthy" || echo "❌ Down ($FE)")"

# Storefront
SF=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 2>/dev/null)
echo "Storefront: $([ "$SF" = "200" ] && echo "✅ Healthy" || echo "❌ Down ($SF)")"

# DB
DB=$(docker exec mscashier-db /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$SA_PASSWORD" -C -Q "SELECT 1" 2>/dev/null)
echo "Database:   $([ $? -eq 0 ] && echo "✅ Healthy" || echo "❌ Down")"

# Containers
echo ""
echo "=== Containers ==="
docker ps --format "table {{.Names}}\t{{.Status}}" | grep mscashier

echo ""
echo "=== Disk Usage ==="
docker system df --format "table {{.Type}}\t{{.Size}}\t{{.Reclaimable}}"
