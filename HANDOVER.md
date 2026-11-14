# Murales PDC — Handover Notes

## What this is
A mobile-first PWA that maps street murals in Playa del Carmen, Mexico. Community-verified locations, photos, tours, and comments.

## Live URL
https://pdc-art.vercel.app/gallery

## Repo
https://github.com/Rainl22/PDC-art — branch: `main`

## Stack
- **Next.js 14** App Router + TypeScript + Tailwind CSS
- **Supabase** (project: `vnezefzguhjhlmbuktlm`) — PostgreSQL + RLS
- **MapLibre GL JS** + free Carto tiles (no API key needed)
- **Google Maps URL scheme** for tour walking navigation
- **Vercel** for hosting (auto-deploys on push to `main`)

## Supabase credentials (never commit)
Store in `.env.local` locally:
```
NEXT_PUBLIC_SUPABASE_URL=https://vnezefzguhjhlmbuktlm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ooOJ-W4XscsdbMoAO_GmgA_QNVatzdb
```
Vercel already has these set as environment variables.

## What's built (Phase 1 & 2)
- `/gallery` — grid of all 17 murals, filter by confidence, multi-select tour builder
- `/gallery/[slug]` — mural detail: hero gradient, location, community status voting, comments
- `/map` — MapLibre map (shows "coming soon" until coordinates are added)
- `/tour` — tour stop list + "Start in Google Maps" walking navigation
- Bottom nav with 4 tabs: Gallery, Map, Tour, (Submit placeholder)
- Supabase DB seeded with all 17 murals (`coordinates: null` for now)
- PWA manifest with sea theme color

## Known issues to fix in next session
1. **Card layout** — text info (title/artist/location) may still overlap the gradient image due to Tailwind spacing tokens. Root cause: `padding`/`inset` were originally outside `extend` in `tailwind.config.ts`, which replaced Tailwind's default spacing scale. This was fixed (moved into `extend`) but needs visual verification on the live URL.
2. **Debug log** — `console.log('[gallery] murals:...')` left in `src/app/(app)/gallery/page.tsx` — remove before launch.
3. **Root redirect** — `/` returns 404. Add a redirect from `/` → `/gallery` in `next.config.mjs` or a simple `page.tsx`.
4. **PWA icons missing** — `public/icon-192.png` and `public/icon-512.png` referenced in manifest but not created yet.
5. **`NEXT_PUBLIC_MAPBOX_TOKEN`** env var referenced but not needed (we use Carto). Clean up if unused.

## Phase 3 (not yet built)
- `/submit` — Submit a Mural form (photo upload to Supabase Storage, inserts into `submissions` table)
- Admin panel — authenticated route to approve/reject submissions, add coordinates
- **Coordinate research** — all 17 murals have `coordinates: null`. Need to verify real lat/lng before placing map pins. NEVER guess coordinates.
- PWA service worker / offline support
- Real mural photos (upload to Supabase Storage, update `cover_photo` column)

## 17 murals in DB (all `coordinates: null`)
la-chica, black-white-portrait-jocka, two-women-water, cenote-diver, corazon-playa,
frida, jaguar, la-catrina, la-chica-senkoe, mariposa, mayan-warrior, mermaid,
owl, pelican, serpent-feathers, abstract-geometric, toucan

## Design tokens
CSS custom properties in `src/styles/tokens.css`, mirrored in `tailwind.config.ts`:
- Colors: `bg`, `surface`, `groove`, `ink`, `ink-2`, `ink-3`, `sea`, `sea-tint`, `sea-dark`
- Confidence: `certain`, `likely`, `guessing`, `removed`
- Fonts: `font-display` (Syne), `font-body` (DM Sans) via Google Fonts `<link>` tag
- Border radius: `rounded-sm/md/lg/xl/full` = 8/16/24/32/9999px

## Key files
```
src/
  app/
    layout.tsx              — root layout, Google Fonts link tag
    (app)/layout.tsx        — shared layout with BottomNav
    (app)/gallery/page.tsx  — server component, fetches murals
    (app)/gallery/[slug]/page.tsx — mural detail
    (app)/map/page.tsx      — MapLibre client component
    (app)/tour/page.tsx     — tour builder client component
  components/
    layout/BottomNav.tsx
    mural/GalleryClient.tsx — filter + multi-select logic
    mural/MuralCard.tsx
    mural/StatusVoting.tsx
    mural/CommentForm.tsx
    ui/ConfidenceBadge.tsx
  lib/
    supabase/client.ts      — browser client
    supabase/server.ts      — server client (SSR)
    murals.ts               — data layer
    gradients.ts            — per-slug gradient placeholders
    tour.ts                 — localStorage + Google Maps URL builder
    seed-data.ts            — 17 mural records
  types/mural.ts
supabase/migrations/001_init.sql
tailwind.config.ts
```
