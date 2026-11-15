'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Artist } from '@/types/mural'

/** Artist directory: names we've seen plus, where known, their Instagram / link. Lets a tag be reused everywhere. */
export interface ArtistInfo { name: string; instagram?: string | null; url?: string | null }

export const artistKey = (n: string) => n.trim().toLowerCase().replace(/^@/, '')
export const artistHref = (a?: { instagram?: string | null; url?: string | null } | null) =>
  a?.url ? a.url : a?.instagram ? `https://www.instagram.com/${a.instagram}/` : null

let cache: Promise<ArtistInfo[]> | null = null
export function loadArtists(force = false): Promise<ArtistInfo[]> {
  if (cache && !force) return cache
  const sb = createClient()
  cache = Promise.all([
    sb.from('artists').select('name,instagram,url'),
    sb.from('murals').select('artist,artists'),
  ]).then(([dir, murals]) => {
    const map = new Map<string, ArtistInfo>()
    for (const a of (dir.data ?? []) as ArtistInfo[]) map.set(artistKey(a.name), a)
    const add = (n?: string | null, extra?: Partial<ArtistInfo>) => {
      const v = n?.trim()
      if (!v || v.length > 80) return
      const k = artistKey(v), cur = map.get(k)
      map.set(k, { ...cur, name: cur?.name ?? v, instagram: cur?.instagram ?? extra?.instagram ?? null, url: cur?.url ?? extra?.url ?? null })
    }
    for (const m of (murals.data ?? []) as { artist: string | null; artists: Artist[] | null }[]) {
      if (m.artists?.length) m.artists.forEach(a => add(a.name, a))
      else m.artist?.split(',').forEach(n => add(n))
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  })
  return cache
}

export function useArtistDirectory() {
  const [artists, setArtists] = useState<ArtistInfo[]>([])
  useEffect(() => { let on = true; loadArtists().then(a => { if (on) setArtists(a) }); return () => { on = false } }, [])
  const find = (name: string) => artists.find(a => artistKey(a.name) === artistKey(name))
  return { artists, names: artists.map(a => a.name), find }
}

/** "Name | handle-or-link" text → Artist; a bare handle is Instagram, any other link is stored as a URL. */
export function parseArtistLine(line: string): Artist | null {
  const [name, raw] = line.split('|').map(x => x.trim())
  if (!name) return null
  if (!raw) return { name, instagram: null, url: null }
  const ig = raw.match(/^https?:\/\/(?:www\.)?instagram\.com\/([^/?#\s]+)/i)
  if (ig) return { name, instagram: ig[1], url: null }
  if (/^https?:\/\//i.test(raw)) return { name, instagram: null, url: raw }
  return { name, instagram: raw.replace(/^@/, ''), url: null }
}

/** Fill in missing links from the directory, then remember anything new. Returns the enriched list. */
export async function enrichAndSaveArtists(list: Artist[]): Promise<Artist[]> {
  const sb = createClient()
  const dir = await loadArtists(true)
  const out: Artist[] = []
  for (const a of list) {
    const known = dir.find(d => artistKey(d.name) === artistKey(a.name))
    const merged: Artist = {
      name: a.name,
      instagram: a.instagram || known?.instagram || null,
      url: a.url || known?.url || null,
    }
    out.push(merged)
    if (!known) await sb.from('artists').insert({ name: merged.name, instagram: merged.instagram, url: merged.url })
    else if ((merged.instagram && merged.instagram !== known.instagram) || (merged.url && merged.url !== known.url)) {
      await sb.from('artists').update({ instagram: merged.instagram, url: merged.url }).ilike('name', known.name)
    }
  }
  cache = null
  return out
}
