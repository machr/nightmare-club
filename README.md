# Spawn Rotation Tracker

A web app for tracking weekly enemy spawn rotations across maps. Built with SvelteKit, Supabase, Tailwind CSS, and shadcn-svelte. Deployed on Vercel.

---

## Overview

Every Tuesday at 1:00 AM Melbourne time, spawn rotations reset. Contributors log in to the admin page and enter the new rotations. The public display page reads from Supabase and renders clean tables per map.

**Maps:**

- **The Spider (River Village)** — Beach, Rice Paddies, Village
- **The Kitsune (Frozen Valley)** — Waterfall, Hillside, Armory
- **The Oni (Broken Castle)** — Foundry, Burned Garden, Keep
- **The Snake (Hidden Temple)** — Pagoda, Cemetery, Courtyard

**Structure per map:**

- 4 Stages
- 3 Waves per stage (12 waves total)
- Stage 1–3: 3 spawns per wave
- Stage 4: 4 spawns per wave
- Each spawn has a location (map-specific) and 1–2 attunements (Sun / Moon / Storm)
- Optional weekly challenge per rotation (e.g. "Lose a location")

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
└── migrations/              # Supabase CLI migrations
```

---

## Setup

1. Create a Supabase project
2. Run `supabase/schema.sql` in the Supabase SQL editor (or use `supabase db push` with the CLI)
3. Optionally run `supabase/seed.sql` for example data
4. Create admin user(s) via Supabase Auth dashboard
5. Set environment variables:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT`
6. `pnpm install && pnpm dev`

---

## Migrations

Migration files live in `supabase/migrations/`. To apply:

```bash
supabase db push
```

Or paste the SQL directly in the Supabase SQL Editor.

---

## Notes

- Supabase free tier pauses after 1 week of inactivity — read traffic from the public page prevents this
- `week_start` stores the Tuesday date for the current rotation week
- The reset boundary is Tuesday 1:00 AM `Australia/Melbourne`

---

## Public API

The app exposes the current week's rotation as JSON at:

- `/api/v1/rotation` - versioned public endpoint
- `/api/rotation` - compatibility alias for the same response

This endpoint is intended for read-only consumers such as alternate frontends.

### Update behavior

- The API always returns the rotation for the current `week_start`
- `week_start` is calculated using the same Tuesday 1:00 AM `Australia/Melbourne` reset logic used by the public site and admin panel
- When rotations are updated in the admin panel, they are saved against that current `week_start`, so the API reflects the same weekly data

### Response shape

```json
{
  "version": "v1",
  "week_start": "2026-04-07",
  "generated_at": "2026-04-07T00:05:00.000Z",
  "maps": [
    {
      "name": "The Snake (Hidden Temple)",
      "slug": "hidden-temple",
      "locations": ["Pagoda", "Cemetery", "Courtyard"],
      "credit_text": "Submitted by ...",
      "updated_at": "2026-04-07T00:03:12.000Z",
      "rounds": [
        {
          "round": 1,
          "challenges": [
            {
              "name": "enemy-ambush",
              "description": "Enemy Ambush"
            }
          ],
          "waves": [
            {
              "wave": 1,
              "spawns": [
                {
                  "location": "Pagoda",
                  "spawn_point": "A",
                  "attunements": ["Sun"]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

### Contract notes

- `attunements` is only present for maps that use attunement tracking
- `updated_at` is the timestamp of the saved weekly rotation for that map
- The response is cached for up to 1 hour with stale revalidation enabled
- Consumers should prefer `/api/v1/rotation` for long-term integrations
