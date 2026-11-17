'use client'
import { useMemo, useState } from 'react'
import { Plus, X, Link2, AlertTriangle } from 'lucide-react'
import { useArtistDirectory, artistKey, parseArtistLine } from '@/lib/artistDirectory'
import { adminField, adminLabel } from './fields'
import type { Artist } from '@/types/mural'

const hasLink = (a: Artist) => !!(a.instagram || a.url)

/** Pick artists from the directory (search), or create a new one; each artist needs an Instagram handle or link. */
export function ArtistPicker({ value, onChange }: { value: Artist[]; onChange: (a: Artist[]) => void }) {
  const { artists: directory } = useArtistDirectory()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)

  const chosen = new Set(value.map(a => artistKey(a.name)))
  const matches = useMemo(() => {
    const k = artistKey(q)
    return directory
      .filter(d => artistKey(d.name) !== 'unknown' && !chosen.has(artistKey(d.name)))
      .filter(d => !k || artistKey(d.name).includes(k) || (d.instagram ?? '').toLowerCase().includes(k))
      .slice(0, 8)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [directory, q, value])
  const exact = directory.some(d => artistKey(d.name) === artistKey(q)) || chosen.has(artistKey(q))

  const add = (a: Artist) => { onChange([...value, a]); setQ(''); setOpen(false) }
  const setLink = (i: number, raw: string) => {
    const parsed = raw.trim() ? parseArtistLine(`${value[i].name} | ${raw.trim()}`) : null
    onChange(value.map((a, j) => j === i ? { name: a.name, instagram: parsed?.instagram ?? null, url: parsed?.url ?? null } : a))
  }

  return (
    <div className="space-y-2">
      <p className={adminLabel}>Artists</p>
      {value.length === 0 && <p className="text-caption text-ink-3">No artist yet. Search below or create a new one.</p>}
      {value.map((a, i) => (
        <div key={a.name + i} className="rounded-panel bg-bg p-2.5 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="flex-1 min-w-0 text-body font-medium truncate">{a.name}</span>
            {hasLink(a)
              ? <span className="inline-flex items-center gap-1 text-caption text-certain shrink-0"><Link2 size={12} />{a.instagram ? `@${a.instagram}` : 'link'}</span>
              : <span className="inline-flex items-center gap-1 text-caption text-guessing shrink-0"><AlertTriangle size={12} />no link</span>}
            <button type="button" aria-label={`Remove ${a.name}`} onClick={() => onChange(value.filter((_, j) => j !== i))} className="text-ink-3 shrink-0"><X size={15} /></button>
          </div>
          <input className={adminField} placeholder="Instagram handle or link (https://…)" inputMode="url" autoCapitalize="none"
            defaultValue={a.instagram ? `@${a.instagram}` : a.url ?? ''} onBlur={e => setLink(i, e.target.value)} />
        </div>
      ))}

      <div className="relative">
        <input className={adminField} value={q} placeholder="Search artists or type a new name…" autoComplete="off"
          onChange={e => { setQ(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} />
        {open && (matches.length > 0 || (q.trim() && !exact)) && (
          <div className="absolute z-20 left-0 right-0 mt-1 bg-surface rounded-panel shadow-xl border border-groove max-h-60 overflow-y-auto">
            {matches.map(d => (
              <button key={d.name} type="button" onMouseDown={e => e.preventDefault()} onClick={() => add({ name: d.name, instagram: d.instagram ?? null, url: d.url ?? null })}
                className="w-full text-left px-3 py-2 text-body flex items-center justify-between gap-2 border-b border-groove last:border-0">
                <span className="truncate">{d.name}</span>
                <span className={`text-caption shrink-0 ${d.instagram || d.url ? 'text-ink-3' : 'text-guessing'}`}>{d.instagram ? `@${d.instagram}` : d.url ? 'link' : 'no link'}</span>
              </button>
            ))}
            {q.trim() && !exact && (
              <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => add({ name: q.trim(), instagram: null, url: null })}
                className="w-full text-left px-3 py-2 text-body text-sea font-display font-semibold flex items-center gap-1.5">
                <Plus size={14} />Create “{q.trim()}”
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
