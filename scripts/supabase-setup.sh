#!/usr/bin/env bash
#
# LeaseFlip — Supabase setup helper
# Links this repo to a hosted Supabase project and applies the schema, so you
# don't have to paste SQL into the dashboard by hand.
#
# Prerequisites:
#   - Supabase CLI installed:  https://supabase.com/docs/guides/cli
#       npm i -g supabase    (or: brew install supabase/tap/supabase)
#   - You are logged in:       supabase login
#
# Usage:
#   ./scripts/supabase-setup.sh <project-ref> [--seed]
#
#   <project-ref>   Your project ref (Dashboard > Project Settings > General,
#                   or the subdomain of your project URL:
#                   https://<project-ref>.supabase.co)
#   --seed          Also load supabase/seed.sql (demo listings/proposal).
#                   Note: seeded profiles require matching auth users — see
#                   the comments at the top of supabase/seed.sql.
#
# Example:
#   ./scripts/supabase-setup.sh abcd1234efgh5678 --seed
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v supabase >/dev/null 2>&1; then
  echo "✗ Supabase CLI not found. Install it first:" >&2
  echo "    npm i -g supabase   # or: brew install supabase/tap/supabase" >&2
  exit 1
fi

REF="${1:-}"
if [ -z "$REF" ]; then
  echo "✗ Missing project ref." >&2
  echo "  Usage: ./scripts/supabase-setup.sh <project-ref> [--seed]" >&2
  exit 1
fi

SEED=false
if [ "${2:-}" = "--seed" ]; then
  SEED=true
fi

echo "→ Linking to project: $REF"
supabase link --project-ref "$REF"

echo "→ Applying migrations (supabase/migrations/*.sql)"
supabase db push

if [ "$SEED" = true ]; then
  echo "→ Seeding demo data (supabase/seed.sql)"
  # `db push` does not run seed.sql against a remote project, so apply it
  # explicitly. Requires SUPABASE_DB_URL or a DB password prompt.
  if [ -n "${SUPABASE_DB_URL:-}" ]; then
    psql "$SUPABASE_DB_URL" -f supabase/seed.sql
  else
    echo "  ⚠ Set SUPABASE_DB_URL to seed automatically, e.g.:" >&2
    echo "    export SUPABASE_DB_URL='postgresql://postgres:[PASSWORD]@db.$REF.supabase.co:5432/postgres'" >&2
    echo "    then re-run with --seed, or paste supabase/seed.sql in the SQL editor." >&2
  fi
fi

cat <<DONE

✓ Done. Next:
  1. Project Settings > API → copy URL + anon + service_role keys
  2. Add them to .env.local (local) and Vercel env vars (deploy)
  3. Authentication > URL Configuration → add your <site>/auth/callback URLs
  See docs/DEPLOYMENT.md for the full checklist.
DONE
