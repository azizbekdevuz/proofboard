#!/usr/bin/env bash
# Generate Prisma client and apply migrations (no data loss).
# Use this to (re)create schema or apply new migrations. Uses .env.local for DATABASE_URL.
set -e
cd "$(dirname "$0")"

echo "→ Generating Prisma client..."
npm run db:generate

echo "→ Applying migrations..."
npm run db:migrate:deploy

echo "→ Database ready."
