#!/usr/bin/env bash
# Validate the schema against a throwaway LOCAL Postgres: applies the Supabase
# shim, every migration, the seed, then the assertions in supabase/dev/checks.sql.
# It drops and recreates the public schema, so it refuses anything that looks
# like a Supabase project.
#
#   DATABASE_URL=postgresql://postgres@127.0.0.1:5432/pdspan_check scripts/db-check.sh
set -euo pipefail
: "${DATABASE_URL:?set DATABASE_URL to a local Postgres database}"
case "$DATABASE_URL" in
  *supabase.co*|*supabase.com*|*pooler.supabase*) echo "refusing to run against a Supabase project" >&2; exit 1 ;;
esac
cd "$(dirname "$0")/.."

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q <<'SQL'
drop schema if exists public cascade;
drop schema if exists auth cascade;
drop schema if exists storage cascade;
create schema public;
SQL

for f in supabase/dev/shim.sql supabase/migrations/*.sql supabase/seed.sql supabase/dev/checks.sql; do
  echo "== $f"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f "$f"
done
echo "db-check: OK"
