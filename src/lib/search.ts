import type { Mural } from '@/types/mural'

/** lower-case, no accents, no leading @ — so "Frida", "frída" and "@frida" all match. */
export const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/@/g, '').trim()

/** Does this mural match what the person typed? Every word must appear in the title, artist(s), their handle, or the location. */
export function matchMural(m: Mural, query: string): boolean {
  const words = norm(query).split(/\s+/).filter(Boolean)
  if (words.length === 0) return true
  const hay = norm([
    m.title, m.artist,
    ...(m.artists ?? []).flatMap(a => [a.name, a.instagram ?? '']),
    m.location_description,
  ].filter(Boolean).join(' '))
  return words.every(w => hay.includes(w))
}
