# Murales PDC — Handover

Last updated: 2026-11-16. Read this first, then `README.md` if you need the basics.

## 1. What this is
A mobile-first PWA that maps the street murals of Playa del Carmen (Quintana Roo, Mexico). Visitors browse a gallery and a map, build walking tours, like murals, and submit new murals, photos, location confirmations and "this spot has a new mural" updates. A small team (one **Owner**, optional **Moderators**) reviews submissions in `/admin`. It's a free hobby project: no ads, no payments, optional sign-in (only needed for the admin area).

- Live: https://www.murles-pdc.art (apex `murles-pdc.art` redirects to www; the domain really is spelled "murles"; `https://pdc-art.vercel.app` also works)
- Repo: https://github.com/Rainl22/PDC-art (`main` auto-deploys to Vercel). Working branch in cloud sessions: `ccr-f856dcb4-5azvka` (fast-forward it to `main` before starting).
- Languages: English (default) and Spanish for everything public; admin screens are English only.

## 2. Infrastructure
| Thing | Where |
|---|---|
| Hosting | Vercel project `pdc-art` (`prj_hby5d2uquf9Ybfrky5uLT34ohHaO`, team `team_FmyVgTkgPEymF4BbIWNnBw9y`, Hobby plan). Env vars: only `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (both public values). Optional: `NEXT_PUBLIC_CONTACT_EMAIL` (shown in the privacy notice; **not set yet**). |
| Database/Auth/Storage | Supabase project `vnezefzguhjhlmbuktlm` (us-east-1). Buckets: `submissions` (public read, anon insert, 5 MB, jpeg/png/webp) and `mural-photos` (admin writes). |
| Push alerts | Supabase Edge Function `notify-submission` (source in `supabase/functions/`, deployed with the Supabase tool, `verify_jwt: false`, authenticates with a shared secret). Keys live in the DB table `app_secrets` (RLS on, no policies; never commit or print them). |
| Maps | MapLibre GL + OpenFreeMap tiles (no key). Walking directions open Google Maps. |
| Google sign-in | Google Cloud project `muralespdc` (Google Auth Platform → Clients). Provider is **not yet enabled in Supabase** (see To do). |

Local dev: `.env.local` with the two `NEXT_PUBLIC_SUPABASE_*` values (anon key is the public publishable one), then `npm run dev`. There is no staging database: dev talks to production data, so don't submit junk.

## 3. How we work (read before changing things)
1. Branch/merge: commit on the working branch, open a PR to `main`, merge (merge commit). Then **confirm the Vercel deployment turns READY** (a failed deploy once went unnoticed). `mcp__Vercel__list_deployments`.
2. Before every merge run: `npx tsc --noEmit`, `npx next lint`, and a real `next build` with the two env vars set. Build-only failures happen (see gotchas).
3. UI changes are verified with Playwright against `next dev` at 390 px (Playwright + Chromium are preinstalled; tiles from OpenFreeMap and geocoders are blocked in the sandbox, so the map background is blank and geocoding is only tested with stubs). Fake GPS with `geolocation` + `permissions`; fake Supabase auth with `page.route`.
4. Database changes go through the Supabase tool (`execute_sql`) **and** get a numbered file in `supabase/migrations/` as the record (files are history, not an automatic runner; don't re-run old files). Test triggers/functions inside a `do $$ … raise exception 'ROLLBACK_TEST %', result; end $$` block so nothing is saved.
5. Never commit emails, secrets or the owner's address. The owner's email is only in the `admins` table.

## 4. Product map
### Public
- **Gallery** `/gallery`: each mural is a photo card with a white overlay card (name, artist, location, ≤2 tags; every line truncated so all cards are equal height). A warm soft-light tint is blended over photos (`--image-tint`, `--image-tint-opacity`). Controls: **Show** (All / Verified / Unverified / Changed) and **Sort** (Name A–Z, Artist A–Z, Recently updated = added or repainted [default], Most liked, Nearest to me — asks for location only when chosen). Both are the custom `components/ui/Select.tsx` (light dropdown, ellipsis, chevron padding). "Create tour" multi-select builds a tour.
- **Mural page** `/gallery/[slug]`: photo carousel (tap for full screen), white rounded sheet over the photo, back button, heart **like** with count (one per anonymous device), title/artist (artist names link to Instagram or another URL via the artist directory), info card (location, precision, small **Verify** pill for unverified murals with a pin, and a tag row: status, Changed, place tag, Rotating wall), Google Maps link, "Add photos / report a change", notes, **Still here / Removed / Update** buttons, comments. Photo credit is only shown while one of the credited bundled photos is still displayed.
- **Submit** `/submit` (opened with query params): new mural (photo **required**, location from typed address / device GPS / photo GPS / pasted map link, artist suggestions from known artists), or for an existing mural `?mural=<slug>&title=…&mode=`: `photos` (same painting or repainted, optional new name), `verify` (location verification), `update` (new mural at the same spot: optional new name + artist), none = location suggestion. Close (X) and Cancel (asks before discarding), then "Go back" / "Submit another".
- **Map** `/map`: pins (solid = location documented to at least intersection level; dashed ring = "lead" only; red/green by status), pin card, "Take me there", search box, locate button + your position dot (auto-starts when the browser already allows location, otherwise a toast explains the button). Same top offset as every page header.
- **Tour** `/tour`: ordered stops, walking estimates, "Start in Google Maps". Stored in localStorage.
- **Menu** (logo, top-left): language, **Install the app** (full screen, no browser bar), sign in/profile/admin/sign out, Privacy, Terms.
- **Auth** `/signin`: Google (button appears automatically once the provider is enabled) or emailed link. Emailed links use the **implicit** flow (`lib/supabase/implicit.ts` → `/auth/finish` hands the session to the cookie client) so they work in any browser; Google uses the normal PKCE client + `/auth/callback`. Sessions persist (cookie, auto-refresh in `middleware.ts`).
- **Legal**: `/privacy`, `/terms` (EN/ES, Mexico-oriented; updated 2026-11-16). Not lawyer-reviewed.
- **PWA**: `public/manifest.json` (standalone, maskable icons), `public/sw.js` (v2: offline fallback, caches build files and bundled photos, **push + notification click handlers**; bump `VERSION` to purge caches).

### Admin (`/admin`, owner + moderators)
- **Submissions**: guide box at the top, each card shows the submission, auto-verified / "GPS + photo" tags, the target mural's artist (with inline "Save artist" and "Edit mural" link), distance to the pin for verifications, rename/new-artist previews. Actions: Create mural… (title, artist(s) with Instagram auto-fill, location, status, precision, "Find on map from address"), Apply location…, Add photos to mural / Replace photos & tag Changed, Confirm location, Reject. **New-mural submissions are never published automatically.**
- **Murals**: full editor (title, artists "Name | handle or link", status, precision, **place**, **rotating wall**, artwork original/changed, location + pin tools incl. address lookup, year/medium/notes, photo credit, photos upload/reorder). **Comments**: moderation. **Team** (`/admin/team`): add moderators by email; Owner can't be removed by anyone; moderators can add/remove other moderators.
- **Alerts**: "Enable alerts" card on `/admin` (per device/browser, iPhone needs the app on the Home Screen). A badge on the Submissions tab shows the pending count.

## 5. Data model (Supabase `public`)
- `murals`: `slug`, `title`, `artist`, `artists` (jsonb `[{name, instagram, url}]`), `artist_verified`, `location_description`, `coordinates` (jsonb `{lat,lng}`), `confidence` (`verified|unverified|removed`; **`likely` was merged into `unverified`**, still tolerated by the type/badge), `precision` (`intersection|landmark|block|area|lead`), `year`, `medium`, `notes`, `photos[]`, `cover_photo`, `photo_credit(_url)`, `artwork_status` (`original|changed`), `artwork_changed_at`, `previous_photos[]`, `artwork_history` (jsonb: earlier `{title, artist, photos, replaced_at}`), `wall_id`, `changes_often`, `place_type`, `like_count`, vote counts, timestamps. Photos starting with `/murals/` are **bundled placeholders** (files in `public/murals/<slug>/N.jpg`, `N-t.jpg` thumbnail); user photos are full Supabase storage URLs.
- `submissions`: `kind` (`new|location|photos_same|photos_repainted|verify_location`), `mural_slug`, title/artist/location/notes/photo_paths/coordinates/`location_source` (`link|device|photo|manual`), `status`, `auto_verified`, `auto_note`, `ip_hash`. (Verification submissions currently use kind `location` with a notes marker "Location verification for existing mural: <slug>"; `verify_location` is allowed only if migration 009 is applied.)
- `comments`, `votes` (one per mural per connection per day), `mural_likes` (+ `like_count`), `walls`, `artists` (directory: name, instagram, url), `admins` (`email`, `role` owner|moderator), `push_subscriptions`, `app_secrets` (server-only).
- Functions/RPC: `is_admin()`, `my_role()`, `list_team()`, `add_team_member()`, `remove_team_member()`, `increment_vote()`, `set_like()`, `request_ip_hash()`, `metres_between()`, `recompute_walls()`.
- Triggers: spam guards on comments/submissions (BEFORE INSERT); `submissions_auto_verify_trg` then `submissions_notify_trg` (AFTER INSERT, in that alphabetical order); `murals_walls` (regroups murals within 20 m after insert/coordinate change).
- **Auto-verify ("only with proof")**: a submission on an existing mural with ≥1 photo and GPS from the device or the photo's EXIF within 50 m of the mural's pin verifies the location, applies the image (bundled placeholders are replaced by the first real photos; "repainted" replaces photos, tags Changed, keeps old name/artist/photos in `artwork_history`, applies an optional new name/artist) and marks the submission approved. GPS is client-reported, so this raises the bar but isn't tamper-proof. Everything else stays pending.
- **Spam limits** (per connection, via IP hash): 5 submissions/hour, 5 comments/10 min, 1 link per comment, 4 photos, size caps, 1 vote per mural per day, 30 like changes per 10 min. Your own testing counts.
- **Walls**: murals within 20 m (chained) share a `wall_id`. Two walls today: the school wall (Día de Muertos school + Mayan Man) and Maria Felix + Mayan Woman. No UI for walls yet (design decision pending).
- RLS: public read of murals/comments/artists/walls; writes admin-only (`is_admin()`); public insert of pending submissions/comments; `app_secrets`, `mural_likes`, `votes` unreadable from the API.

### Migrations (`supabase/migrations/`)
001–005 base schema, storage, artist links, coordinates, admins+RLS · 006 spam protection (**applied**, adapted to `create or replace trigger`) · 007 artwork changes/photo update kinds · 008 walls · 009 `verify_location` kind (**not applied; optional**) · 010 artist directory · 011 auto-verify · 012 push notifications (trigger + tables; the Edge Function and the `app_secrets` rows were created separately) · 013 team roles · 014 update with new artist · 015 likes + likely→unverified · 016 place type + stale credit cleanup.

## 6. Design system (src/styles/tokens.css + tailwind.config.ts)
- Radius roles `rounded-panel` 16 / `rounded-card` 24 / `rounded-sheet` 32. Spacing roles: `gutter`, `grid`, `card-inset` (bottom gap 10 px), `card-inset-x` (side gap 4 px), `sheet-overlap`, `control` (44 px), `gap-control`, `controls` (top offset 24 px for back/menu/search/page titles; every page title row sits at the same y). Type scale: `text-tag-sm` 8, `text-tag` 9, `text-caption` 11, `text-small` 12, `text-body` 14, `text-card` 15, `text-title` 22.
- One pill component `components/ui/Tag.tsx` (ConfidenceBadge, ArtworkBadge, PlaceTags wrap it). Place types: `lib/places.ts` + DB check + `place.*` i18n. Tag labels: "At a restaurant/bar/school/dive shop/hotel/gym", "Rotating wall" (`changes_often`).
- **Converted to tokens**: gallery, mural page, map header, page headers. **Still hard-coded**: submit form, admin, tour, profile, side menu, legal (next step for the design system).
- i18n: every public string is in `lib/i18n/dict.ts` (EN + ES, typed keys); locale in the `locale` cookie.

## 7. Owner to-do (needs the owner's accounts)
- [ ] **Google sign-in** (also removes the email limit): Google Cloud → muralespdc → Clients → create Web client (JS origin `https://www.murles-pdc.art`, redirect URI `https://vnezefzguhjhlmbuktlm.supabase.co/auth/v1/callback`); Audience → publish ("In production"; don't submit for verification); Supabase → Authentication → Providers → Google: paste Client ID/Secret, enable. The button appears on `/signin` by itself.
- [ ] Verify Supabase → Authentication → URL Configuration: Site URL `https://www.murles-pdc.art`; Redirect URLs `https://www.murles-pdc.art/**`, `https://murles-pdc.art/**`, `https://pdc-art.vercel.app/**`, `http://localhost:3000/**`.
- [ ] Sign in once with the real flow and confirm refresh keeps you signed in (never verified with a real session yet).
- [ ] Optional: custom SMTP (e.g. Resend with the new domain) — Supabase's built-in email allows only a few emails per hour (hit on 2026-11-16).
- [ ] Optional: Vercel → Domains → redirect `pdc-art.vercel.app` to `www.murles-pdc.art`; reinstall the PWA and re-enable alerts on the new domain.
- [ ] Set `NEXT_PUBLIC_CONTACT_EMAIL` (decide on a public contact address) and redeploy.
- [ ] Review the 6 pending submissions in `/admin` (Gober restaurant, Viva Playa del Carmen, Frida Khalo = new murals; "The gym mural" and "Giant Sea Turtles" = repainted photo updates; a location suggestion for Día de Muertos 2025). These are test-flow items; publishing one new mural is how to learn the admin flow.
- [ ] Tip jar idea: first check Vercel Hobby fair-use rules; add a Terms line that tips are voluntary/non-refundable; options discussed: Ko-fi, Buy Me a Coffee, PayPal.me, Stripe link, Mercado Pago/CLABE.

## 8. Open decisions / backlog
- How should **walls** and the **Rotating wall** tag appear in the UI (data exists)? Show `artwork_history` (old names/photos) somewhere?
- Map pin legend or a single pin style (solid vs dashed confuses people).
- Fingerprint sign-in: parked. Via Google passkeys it comes free; a custom WebAuthn build would use an Edge Function that verifies the assertion and mints a session with `auth.admin.generateLink`.
- Auto-publishing new murals with GPS+photo evidence (currently manual on purpose).
- Hide the "Still here/Removed" counts is done; votes are still collected. Could flag murals with many "Removed" votes in admin + push.
- Remaining ~15 bundled placeholder murals still show credited third-party photos (credit text shown); replace with community photos over time. `public/murals/*/N-t.jpg` extra thumbnails are kept on purpose (the editor derives covers from them).
- More sorts considered: Most photos, Recently verified (needs a date field).
- Seasonal/year-stamped murals (e.g. Día de Muertos 2025) may deserve a "seasonal" tag.
- Tint decision: the warm soft-light tint is on gallery cards only; mural page photos are untouched.

## 9. Gotchas learned the hard way
- `supabase/functions/` (Deno) is **excluded from `tsconfig.json`**; including it broke the Next build and the production deploy once.
- `@supabase/ssr` forces the PKCE flow, so emailed links opened in a different browser fail with "code verifier not found". That's why email links use `createImplicitClient()` (plain `supabase-js`) and `/auth/finish`.
- Supabase's built-in email: `429 over_email_send_rate_limit` after a few emails/hour; the sign-in form says so. Each emailed link is single use and only the newest works.
- The Supabase SQL tool asks the user to confirm any statement containing `delete`/`drop`/`truncate`; if nobody answers within 60 s it times out and nothing runs. For those, give the owner SQL for the dashboard SQL editor or write the statement without them (e.g. `create or replace trigger`). A multi-statement call is one transaction: an error rolls back everything, including earlier `create function`s.
- IP-based limits read `request.headers` (`request_ip_hash()`); in tests set `set_config('request.headers', '{"x-forwarded-for":"203.0.113.7"}', true)`.
- Vercel Hobby keeps runtime logs for 1 hour; Supabase auth logs show sign-in failures (`mcp__Supabase__query_logs`, source `auth_logs`, times are UTC; the owner is UTC−5).
- A mural without coordinates isn't on the map; the "N murals not on the map" toast was removed on request.
- Geocoding/Overpass/OpenFreeMap hosts are blocked in the agent sandbox; the admin "Find on map from address" button is tested only with stubbed responses.
- Don't write `rounded-xl` expecting Tailwind's default: this project overrides radii (xl = 32 px). Prefer the role tokens.
- Test submissions you create in production are real rows; delete them (needs the dashboard) or reject them in `/admin`.

## 10. Where things are
```
src/app/(app)/{gallery,map,tour,submit,signin,profile,admin,privacy,terms}   routes
src/app/auth/{callback,finish}     Google/PKCE callback, emailed-link landing
src/app/api/resolve-map-link       pasted Google/Apple map link → coordinates (rate limited)
src/components/{mural,ui,admin,auth,layout,legal,brand}
src/lib/{supabase,i18n,legal,auth}  clients (browser/server/implicit), dictionary, legal text, useAuth
src/lib/{murals,geo,geocode,places,artistDirectory,device,tour,image,push}.ts
src/middleware.ts                  refreshes the auth session on every request
public/{sw.js,manifest.json,murals/}
supabase/migrations/               numbered history; supabase/functions/notify-submission/
```
