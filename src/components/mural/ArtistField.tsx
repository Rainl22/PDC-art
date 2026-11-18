'use client'
import { useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { norm } from '@/lib/search'
import { useT } from '@/lib/i18n/client'

/** Artist input with a proper dropdown of known artists (instead of the browser's datalist). Typing still works for new artists;
 *  several artists are separated by commas, and the list filters on the part you are typing. */
export function ArtistField({ value, onChange, names, placeholder, ariaLabel, className, single }: {
  value: string; onChange: (v: string) => void; names: string[]; placeholder: string; ariaLabel: string; className: string
  /** One artist only: the whole text is the artist (no comma-separated list). */
  single?: boolean
}) {
  const { locale } = useT()
  const newLabel = (n: string) => (locale === 'es' ? `Agregar “${n}” como artista nuevo` : `Add “${n}” as a new artist`)
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)
  const parts = single ? [value] : value.split(',')
  const typing = parts[parts.length - 1].trim()
  const chosen = useMemo(() => new Set(parts.map(p => norm(p))), [value]) // eslint-disable-line react-hooks/exhaustive-deps
  const isNew = typing.length > 0 && !names.some(n => norm(n) === norm(typing))   // typed something we don't know yet
  const options = useMemo(() => {
    const q = norm(typing)
    return names.filter(n => !chosen.has(norm(n)) && (!q || norm(n).includes(q))).slice(0, 30)
  }, [names, typing, chosen])

  function pick(n: string) {
    onChange([...parts.slice(0, -1).map(p => p.trim()).filter(Boolean), n].join(', '))
    setOpen(false)
  }

  return (
    <div ref={wrap} className="relative"
      onBlur={e => { if (!wrap.current?.contains(e.relatedTarget as Node)) setOpen(false) }}>
      <input className={`${className} pr-10`} value={value} autoComplete="off" placeholder={placeholder} aria-label={ariaLabel}
        role="combobox" aria-expanded={open} aria-autocomplete="list"
        onFocus={() => setOpen(true)} onChange={e => { onChange(e.target.value); setOpen(true) }}
        onKeyDown={e => { if (e.key === 'Escape') setOpen(false) }} />
      <button type="button" tabIndex={-1} aria-label={ariaLabel} onClick={() => setOpen(o => !o)}
        className="absolute right-0 top-0 h-full w-control flex items-center justify-center text-ink-2"><ChevronDown size={18} /></button>
      {open && (options.length > 0 || isNew) && (
        <ul role="listbox" className="absolute z-30 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-surface rounded-panel shadow-2 border border-groove py-1">
          {options.map(n => (
            <li key={n} role="option" aria-selected={false}>
              <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => pick(n)}
                className="w-full min-h-control px-3 text-left text-14 text-ink hover:bg-bg">{n}</button>
            </li>
          ))}
          {isNew && (
            <li role="option" aria-selected={false}>
              <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => pick(typing)}
                className="w-full min-h-control px-3 text-left text-14 font-semibold text-sea hover:bg-bg">+ {newLabel(typing)}</button>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
