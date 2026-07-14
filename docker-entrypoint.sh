#!/bin/sh
set -e

# ── Validate DATABASE_URL ────────────────────────────────────────────────────
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL is empty. Set it in Coolify:"
  echo "   postgresql://becode:becode@db:5432/becode"
  exit 1
fi

echo "🔗 DATABASE_URL=$DATABASE_URL"

# ── Wait for PostgreSQL ──────────────────────────────────────────────────────
echo "⏳ Waiting for PostgreSQL..."
CONNECTED=0
for i in $(seq 1 30); do
  if pg_isready -d "$DATABASE_URL" -t 2 >/dev/null 2>&1; then
    echo "✅ PostgreSQL is ready."
    CONNECTED=1
    break
  fi
  echo "   attempt $i/30 — retrying in 2s..."
  sleep 2
done

if [ "$CONNECTED" -eq 0 ]; then
  echo "❌ PostgreSQL did not become ready after 60s."
  echo "   Check that DATABASE_URL points to the Docker service name 'db', not 'localhost'."
  exit 1
fi

# ── Run migrations ───────────────────────────────────────────────────────────
echo "🚀 Running Prisma migrations..."
npx prisma migrate deploy

# ── Start the Astro standalone server ────────────────────────────────────────
echo "🌐 Starting Astro on port $PORT..."
exec node ./dist/server/entry.mjs
