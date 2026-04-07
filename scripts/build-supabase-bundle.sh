#!/usr/bin/env bash
# Собирает один SQL-файл для вставки в Supabase SQL Editor (schema, затем migrations по имени).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$ROOT/supabase/_bundle_for_sql_editor.sql}"
{
  echo "-- === schema.sql ==="
  cat "$ROOT/supabase/schema.sql"
  for f in $(ls "$ROOT/supabase/migrations"/*.sql 2>/dev/null | sort); do
    echo ""
    echo "-- === $(basename "$f") ==="
    cat "$f"
  done
} > "$OUT"
echo "Written: $OUT"
echo "Откройте файл и выполните целиком в Supabase → SQL Editor (или по частям при ошибке размера)."
