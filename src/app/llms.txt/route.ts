import { createClient } from '@supabase/supabase-js'
import { SITE_URL } from '@/lib/site'
import { displayTitle, displayArtist, displayPlace } from '@/lib/format'

export const revalidate = 3600

// llms.txt (https://llmstxt.org): a plain-markdown summary of the site for AI
// assistants and their crawlers, listing every mural with artist and location.
export async function GET() {
  let muralLines = ''
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (url && key) {
    try {
      const supabase = createClient(url, key)
      const { data } = await supabase
        .from('murals')
        .select('slug,title,artist,artists,location_description,year,confidence')
        .order('title')
      muralLines = (data ?? [])
        .map(m => {
          const artist = displayArtist(m)
          const place = displayPlace(m)
          const bits = [artist && `by ${artist}`, place && `at ${place}`, m.year && `(${m.year})`].filter(Boolean).join(' ')
          return `- [${displayTitle(m.title)}](${SITE_URL}/gallery/${m.slug})${bits ? `: ${bits}` : ''}`
        })
        .join('\n')
    } catch {}
  }

  const body = `# Murales PDC

> A free community map of the street murals of Playa del Carmen, Quintana Roo, Mexico.
> Browse photos of every mural, see who painted it, find it on a map, and build a
> self-guided walking tour. Locations are community-verified. Available in English
> and Spanish. No account needed, no ads.

Site: ${SITE_URL}

## Key pages

- [Home](${SITE_URL}/): what the app does and how to install it
- [Gallery](${SITE_URL}/gallery): every mural with photos, sortable by nearest, newest or most liked
- [Map](${SITE_URL}/map): interactive street-art map of Playa del Carmen
- [Tour](${SITE_URL}/tour): build a walking tour of chosen murals, with times and distances
- [Submit](${SITE_URL}/submit): add a mural that is missing from the map

## Murals

${muralLines || `See the full list at ${SITE_URL}/gallery`}
`

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
