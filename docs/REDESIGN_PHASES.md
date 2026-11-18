# Redesign phases

Spec: the "Murales PDC: design improvements spec" (design critique, 17 Nov 2026). Owner decisions: pins are photo pins with a solid ring (green/amber), 44px, **no legend/chips**.

## Phase 1: Core pass (done in this branch)
Tokens + type/contrast (4.1) · gallery card, header, chips, sort sheet, tour tray (4.2, 4.3) · map photo pins, grouping, pin card (4.4, no chips/list view) · tour screen (4.5) · nav renames + visible menu button + tab bar (4.7) · Add a mural form (4.8) · detail page polish (4.11) · reduced motion, focus ring (4.12).

Not done on purpose, decide later:
- Long-press on a card to add to tour (not discoverable, iOS fights it): use the pin card and mural page instead.
- Card photo count shows "icon + n", not "1/n" (there is no swipe on cards).
- Map pin card keeps the swipeable photos from the last thread (inside the 96x120 thumbnail).
- Tour "Expand map" button, suggested "Centro in 1 hour" tour (needs curated data).
- Add-a-mural mini map in the location card, "Adjust" link.
- Neighbourhood in card meta (no such field in the data; shows the location text).
- "Frida khalo" is a data typo (should be Kahlo): fix in `/admin/murals`.

## Phase 2: Landing + sharing (4.9, H7, H8) — done in this branch
Notes: landing copy is now EN + ES (cookie `locale`, ES/EN toggle in the nav); counts come from the database; QR is the static `public/site/qr-map.svg` (points to /map); share image is `public/og.png` (made from an HTML mock, re-render if the tagline changes). **The three phone screenshots on the landing (`public/site/app-*.jpg`) still show the old app design: retake them from the live site after the merge.**
Mobile hero with a full photo and one CTA, proof strip (counts), install hint, ES/EN toggle on the landing nav, fix "Add a mural" link (`/submit`), `og:image` + `twitter:card=summary_large_image`, per-mural `og:image`.

## Phase 3: Desktop layout (4.6): done in this branch
Notes: breakpoints are 640 (3 columns, content capped at 960), 1024 (top app bar, two-pane Explore with sticky map panel, two-column mural page, floating 380px pin card) and 1600 (4 columns). `--nav-h` becomes 0 and `--topbar-h` 72px at >=1024. Pins are shared via `lib/useMuralPins.ts`. The top-bar search sends people to `/gallery?q=`. Phone tour tray is hidden on desktop (the docked tray lives in the map panel). Not done: hover highlight on the *pin* is wired but untested with real tiles (tiles are blocked here).
Top app bar at >=1024px, two-pane explore (cards + sticky map), 3-4 column grid, two-column mural page, floating pin card, hover "Add to tour".

## Phase 4: Images and performance (4.10, H6): done in this branch
How: Supabase image resizing isn't available on this plan (`FeatureNotEnabled`), so every photo gets a 600px copy stored next to it as `<name>-t.jpg` (about 50 KB vs about 500 KB). `lib/thumb.ts` maps a photo URL to its thumb (also bundled `/murals/<slug>/N.jpg` → `N-t.jpg`); `ThumbImg` falls back to the full photo if the thumb is missing. New uploads (Add a mural form, admin editor) create the thumb automatically (`lib/image.ts` `uploadThumb`). The 38 existing photos were backfilled once with `scripts/backfill-thumbs.py` (re-run it with the photo URLs if any are ever missing). Fonts are self-hosted through `next/font`. Result on a 390px phone: first load of /gallery about 1.2 MB of images (was about 9.6 MB), whole page scrolled about 1.6 MB. The mural page still loads the full photos on purpose.
Thumbnails for submissions (480/160/1200 px, WebP) at upload/approval, `srcset`/`sizes`, self-hosted fonts. Gallery currently loads about 9.6 MB of originals.

## Later
Walls and "Rotating wall" display, `artwork_history`, "List view" on the map.
