#!/bin/sh
set -e

# ── Wait for PostgreSQL ──────────────────────────────────────────────────────
echo "⏳ Waiting for PostgreSQL..."
for i in $(seq 1 30); do
  if pg_isready -d "$DATABASE_URL" -t 2 >/dev/null 2>&1; then
    echo "✅ PostgreSQL is ready."
    break
  fi
  echo "   attempt $i/30 — retrying in 2s..."
  sleep 2
done

# ── Run migrations ───────────────────────────────────────────────────────────
echo "🚀 Running Prisma migrations..."
npx prisma migrate deploy

# ── Start the Astro standalone server ────────────────────────────────────────
echo "🌐 Starting Astro on port $PORT..."
exec node ./dist/server/entry.mjs
