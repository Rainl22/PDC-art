# Murales PDC — Brand Details

Source of truth: `src/styles/tokens.css`, `tailwind.config.ts`, `public/manifest.json`, `src/components/brand/Logo.tsx`.
Use this file to build the design system later.

## Identity
- **Name:** Murales PDC (short: MuralesPDC)
- **Tagline:** "Street art of Playa del Carmen" (ES: "Arte urbano de Playa del Carmen")
- **What it is:** a free, mobile-first web app (PWA, installable) that maps the street murals of Playa del Carmen, Quintana Roo, Mexico.
- **Core features:** explore murals (gallery + map) · learn about the artists (links to their Instagram) · build walking tours · contribute new murals, photos and corrections.
- **Free:** no ads, no payments. Sign-in is optional and only used by the admin team.
- **Languages:** English (default) and Spanish.
- **Live URL:** https://www.murles-pdc.art (the domain really is spelled "murles")
- **Tone:** warm, local, curious, community-driven. Simple words. Credit artists always.

## Logo
- Cream "M" (a single polyline) on a rounded sea-blue square (corner radius 22 of 100).
- Files: `brand/logo/icon-512.png`, `brand/logo/icon-maskable-512.png`. SVG source is in `src/components/brand/Logo.tsx`.
- Colors: tile `#326A82`, M stroke `#F3F1EC`, stroke width 9, round caps and joins.

## Color
| Token | Hex | Use |
|---|---|---|
| bg | `#F3F1EC` | page background (warm cream) |
| surface | `#FFFFFF` | cards, sheets |
| groove | `#E5E2DA` | borders, dividers |
| ink | `#18171A` | primary text |
| ink-2 | `#68636A` | secondary text |
| ink-3 | `#A09CA4` | tertiary / placeholder text |
| sea | `#326A82` | primary brand color, buttons, theme color |
| sea-dark | `#245970` | pressed / hover |
| sea-tint | `#E8F2F6` | light brand backgrounds |
| certain (verified) | `#0A7560` on `#E4F3EF` | verified status |
| likely | `#A86C10` on `#FBF0DC` | (merged into unverified, still tolerated) |
| guessing (unverified) | `#9E2222` on `#F9E5E5` | unverified status |
| removed | `#6038A0` on `#EEE6F7` | removed status |
| you | `#2F6FEB` | "you are here" dot |
| image tint | `#C9A57B` at 50% soft-light | warm tint on gallery photos |

Overlays: glass `rgb(255 255 255 / .85)`, scrim `rgb(0 0 0 / .5)`. Light theme only.
For the website: lead with cream + sea blue; let the mural photos supply the color.

## Typography
- **Display:** Syne (400, 600, 700, 800) — Google Fonts. Headlines, titles.
- **Body:** DM Sans (300, 400, 500, 600) — Google Fonts.
- **App scale (mobile):** tag 8–9px · caption 11px · small 12px · body 14px · card title 15px · page title 22px. A website needs a larger scale; keep the same two fonts.

## Shape and spacing
- Radius: 8 (chips, thumbnails) · 16 (inner panels, inputs) · 24 (cards) · 32 (sheets) · full (pills, round buttons).
- Spacing: 4px grid; screen gutter 16px; gap between gallery cards 12px.
- Style: rounded white cards over cream, photo-first, soft shadows, pill-shaped tags.

## Imagery
- Selected photos: `brand/photos/` (12 murals, about 1536px wide). The full set is in `public/murals/<slug>/`.
- Photos are placeholders from the bundled set; some have a photo credit. Credit the artist and photographer when the credit is known.
- Use only photos you have permission to use.

## Web-app screens worth showing (take screenshots from the live app)
Gallery (`/gallery`) · Mural page (`/gallery/[slug]`) · Map (`/map`) · Tour (`/tour`) · Submit (`/submit`). Use a 390px-wide phone viewport.

## Voice samples (from the app)
- "Street art of Playa del Carmen"
- Verified / Unverified murals, "Still here", "Removed", "Update"
- Actions: Create tour · Add photos / report a change · Take me there · Start in Google Maps · Install the app
