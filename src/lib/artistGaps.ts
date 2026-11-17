import type { SupabaseClient } from '@supabase/supabase-js'

export interface ArtistGap { name: string; murals: { id: string; title: string }[] }

/** Artists on murals that have no Instagram/link (neither on the mural nor in the artist directory). */
export async function loadArtistGaps(sb: SupabaseClient): Promise<ArtistGap[]> {
  const [{ data: dir }, { data: murals }] = await Promise.all([
    sb.from('artists').select('name,instagram,url'),
    sb.from('murals').select('id,title,artist,artists'),
  ])
  const key = (n: string) => n.trim().toLowerCase().replace(/^@/, '')
  const linked = new Set((dir ?? []).filter(a => a.instagram || a.url).map(a => key(a.name)))
  const gaps = new Map<string, ArtistGap>()
  for (const m of murals ?? []) {
    const list: { name: string; instagram?: string | null; url?: string | null }[] =
      m.artists?.length ? m.artists : (m.artist ?? '').split(',').map((n: string) => ({ name: n.trim() }))
    for (const a of list) {
      if (!a.name || key(a.name) === 'unknown' || a.instagram || a.url || linked.has(key(a.name))) continue
      const g = gaps.get(key(a.name)) ?? { name: a.name, murals: [] }
      g.murals.push({ id: m.id, title: m.title })
      gaps.set(key(a.name), g)
    }
  }
  return Array.from(gaps.values()).sort((x, y) => x.name.localeCompare(y.name))
}
