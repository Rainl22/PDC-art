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

---
## Update — menu, i18n, auth, legal, admin
- **Logo = side menu** (`components/layout/SideMenu.tsx`): language (EN default / ES), sign in (optional), profile, admin (admins only), Privacy, Terms.
- **i18n**: `lib/i18n/` (dict.ts has every string in EN + ES; locale kept in `locale` cookie). Admin screens are English-only.
- **Auth**: Supabase email magic link (`/signin`, `/auth/callback`). Needs Supabase Auth → URL Configuration: Site URL = production URL, Redirect URLs include `https://<domain>/auth/callback`.
- **Admins**: `admins` table (email allowlist, seed via SQL, never commit emails) + `is_admin()`; RLS in `supabase/migrations/005_*`.
- **Admin area** `/admin`: submissions queue (create mural / apply location / reject), mural editor (photos, coordinates, artists + Instagram, credits), comment moderation.
- **Legal**: `/privacy`, `/terms` (EN/ES, Mexico-oriented; `NEXT_PUBLIC_CONTACT_EMAIL` env var shows the contact address). Have a lawyer review before launch.
- **Submit**: pin from map link (`/api/resolve-map-link`), device GPS or photo EXIF; photos re-encoded client-side (EXIF stripped).

## Spam protection + offline (latest)
- `supabase/migrations/006_spam_protection.sql` — DB-side limits (comment 5/10 min, submission 5/hour, 1 link per comment, size limits, 1 vote/mural/IP/day via SECURITY DEFINER `increment_vote`; IPs stored only as a hash). **Apply it** (the Supabase prompt needs approval).
- Forms also have a honeypot field; `/api/resolve-map-link` has a best-effort rate limit.
- Service worker (`public/sw.js`, `public/offline.html`): pages network-first with offline fallback; hashed build files + mural photos cached. Bump `VERSION` in sw.js to purge caches.
- Removed: unused `seed-data.ts`, `mapbox-gl`, the non-functional heart button.

## Artwork changes + photo updates (migration 007, applied)
- `murals.artwork_status` (`original`|`changed`), `artwork_changed_at`, `previous_photos`. Location is `confidence`/`precision`; the painting itself is `artwork_status`. Cards/detail/map show a **Changed** tag.
- Mural detail → "Add photos / report a change" → `/submit?mural=<slug>&mode=photos` (photo required; user picks same painting / repainted). Stored as `submissions.kind` = `photos_same` | `photos_repainted` + `mural_slug`.
- Admin submissions: photo updates get one button; repainted moves old photos to `previous_photos`, replaces photos, tags Changed. Mural editor has an Artwork select.
- Not built: AI same-vs-new check (admin decides from the user's choice + photos).

## To do (owner)
- [ ] **Decide on `006_spam_protection.sql`: it was never applied to the database** (no rate limits on comments/submissions, vote function not the fixed version). Applying it adds limits (5 submissions/hour/IP, comments 5/10 min) that also affect your own testing.
- [ ] Supabase Auth → URL Configuration: Site URL = https://pdc-art.vercel.app and Redirect URLs include https://pdc-art.vercel.app/** (sign-in emails currently send people to localhost).
- [x] Walls migration applied (school wall pair; Maria Felix + Mayan Woman); `changes_often` set on dia-de-muertos-2025 and dia-de-muertos-school. New/moved murals regroup automatically (20 m, chained).
- [x] Auto-verify (011), artist directory (010), push alerts (012 + `notify-submission` Edge Function) are live.
- [ ] Run the `remove_team_member` function from `supabase/migrations/013_team_roles.sql` in the Supabase SQL editor (the rest of 013 is applied; Remove on the Team page fails until this runs).
- [ ] Turn on alerts: open /admin on the live site on each device and press Enable alerts (iPhone: add to Home Screen first).
- [ ] Review the 3 pending new-mural submissions in /admin (Frida, Viva Playa del Carmen, Gober restaurant).
- [ ] Decide how walls and the `changes_often` tag should look in the UI (data only so far).
- [ ] `009_verify_submissions.sql` is optional (only needed if a `verify_location` kind is ever used).

## Team + renames
- `admins.role`: `owner` (first admin; can't be removed by anyone) / `moderator` (everything else, can add/remove other moderators). Managed on /admin/team through `list_team`, `add_team_member`, `remove_team_member`, `my_role` (migration 013).
- Repainted photo updates can carry a new name. `murals.artwork_history` keeps `{title, photos, replaced_at}` for each earlier version (written by the auto-verify trigger and the admin approve button). No UI for history yet.
- Note: `supabase/functions/` is excluded from `tsconfig.json` (Deno code); including it breaks the Next.js build.

## Design tokens (src/styles/tokens.css + tailwind.config.ts)
- Radius roles: `rounded-panel` (16), `rounded-card` (24), `rounded-sheet` (32). Spacing roles: `gutter`, `grid`, `card-inset`, `sheet-overlap`, `control`, `gap-control`, inset `controls` (top offset for back/menu/search). Type scale: `text-tag-sm` 8, `text-tag` 9, `text-caption` 11, `text-small` 12, `text-body` 14, `text-card` 15, `text-title` 22.
- Every pill is `components/ui/Tag.tsx` (ConfidenceBadge, ArtworkBadge, PlaceTags wrap it). Place types live in `lib/places.ts` (+ DB check constraint on `murals.place_type`); the rotating-wall tag reads `murals.changes_often`.
- Converted so far: gallery (card + controls), mural page, map header. Still hard-coded px/colours elsewhere: submit form, admin, tour, profile, side menu.
