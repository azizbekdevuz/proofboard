#!/usr/bin/env bash
# Dev startup: one schema only (Note table with category, referenceId, counts).
# from the local migrations directory", run once:  npm run db:reset
set -e
cd "$(dirname "$0")"

echo "→ Generating Prisma client..."
npm run db:generate

echo "→ Applying database migrations (non-interactive)..."
npx dotenv -e .env.local -- prisma migrate deploy

echo "→ Starting dev server..."
npm run dev
