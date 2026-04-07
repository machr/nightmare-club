# Локальный стенд (кратко)

- **Форк:** `origin` → `https://github.com/swiezdo/nightmare-club`, `upstream` → `machr/nightmare-club`.
- **Node:** нужен **20+** (на этой машине обновлено до 20.x для Vite 8). После смены версии Node: `rm -rf node_modules && pnpm install`.
- **Supabase:** в проекте на [supabase.com](https://supabase.com) выполните в SQL Editor содержимое **`supabase/_bundle_for_sql_editor.sql`** (собирается командой `./scripts/build-supabase-bundle.sh`) **или** по очереди `schema.sql` и все файлы из `supabase/migrations/`. Затем подставьте в **`.env`** реальные `PUBLIC_SUPABASE_*` и `SUPABASE_SERVICE_ROLE_KEY`.
- **Токены бота:** в `.env` уже сгенерированы `BOT_API_TOKEN_*`; после правок Supabase перезапустите `pnpm dev`.
- **Проверка:** с реальной БД `curl` из [`BOT_AUTH_SETUP.md`](./BOT_AUTH_SETUP.md) должен вернуть `"ok":true`. С плейсхолдерами Supabase PUT вернёт **404** на неизвестный `map_slug` — это нормально.
