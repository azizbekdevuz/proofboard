#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

echo "→ Generating Prisma client..."
npm run db:generate

echo "→ Running database migrations..."
npm run db:migrate

echo "→ Starting dev server..."
npm run dev
