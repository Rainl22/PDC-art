# Murales PDC

A mobile-first PWA that maps street murals in Playa del Carmen, Mexico.

## Stack

- **Next.js 14** App Router + TypeScript + Tailwind CSS
- **Supabase** (PostgreSQL + RLS) for data
- **MapLibre GL JS** + free Carto raster tiles (no API key required)
- **Google Maps URL scheme** for tour walking navigation

## Getting Started

```bash
npm install
```

Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
