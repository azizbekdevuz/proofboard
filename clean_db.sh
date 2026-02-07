#!/usr/bin/env bash
# Empty the database and re-apply all migrations from scratch (all data lost).
# Uses .env.local for DATABASE_URL. Run from project root.
set -e
cd "$(dirname "$0")"

echo "→ Resetting database (drop + re-apply migrations)..."
npx dotenv -e .env.local -e .env -- prisma migrate reset --force

echo "→ Done. Database is empty and migrations are applied."
