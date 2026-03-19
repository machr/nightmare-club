# Spawn Rotation Tracker

A web app for tracking weekly enemy spawn rotations across maps. Built with SvelteKit, Supabase, Tailwind CSS, and shadcn-svelte. Deployed on Vercel.

---

## Overview

Every Saturday, spawn rotations reset. Contributors log in to the admin page and enter the new rotations. The public display page reads from Supabase and renders clean tables per map.

**Maps:**

- **Hidden Temple** — Pagoda, Cemetery, Courtyard
- **Frozen Valley** — Waterfall, Hillside, Armory
- **Broken Castle** — Foundry, Burned Garden, Keep

**Structure per map:**

- 4 Stages (each with an optional modifier)
- 3 Rounds per stage (12 rounds total)
- Stage 1–3: 3 spawns per round
- Stage 4: 4 spawns per round
- Each spawn has a location (map-specific) and element (Sun / Moon / Storm)

---

## Tech Stack

| Layer     | Tool                         |
| --------- | ---------------------------- |
| Framework | SvelteKit                    |
| UI        | shadcn-svelte + Tailwind CSS |
| Database  | Supabase (Postgres)          |
| Auth      | Supabase Auth                |
| Hosting   | Vercel                       |

---

## Project Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── ui/              # shadcn-svelte components
│   │   └── MapTable.svelte  # Rotation table for a single map
│   ├── types.ts             # TypeScript types
│   └── supabase.ts          # Supabase client setup
├── routes/
│   ├── +page.svelte         # Public display — current week's rotations
│   └── (admin)/admin/
│       ├── +page.svelte     # Admin edit page (protected)
│       └── +page.server.ts  # Server load + form actions
supabase/
├── schema.sql               # Database schema + seed data
├── seed.sql                 # Example rotation seed data
└── migrate-maps.sql         # Migration for updating maps
```

---

## Setup

1. Create a Supabase project
2. Run `supabase/schema.sql` in the Supabase SQL editor
3. Optionally run `supabase/seed.sql` for example data
4. Create admin user(s) via Supabase Auth dashboard
5. Set environment variables:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT`
6. `pnpm install && pnpm dev`

---

## Notes

- Supabase free tier pauses after 1 week of inactivity — read traffic from the public page prevents this
- `week_start` should always be a Saturday
