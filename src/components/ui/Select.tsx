'use client'
import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export interface SelectOption<T extends string> { value: T; label: string }

/**
 * Light dropdown (replaces the native picker, which follows the phone's dark theme).
 * Long values are cut with an ellipsis and the chevron keeps its own space from the edge.
 */
export function Select<T extends string>({ value, options, onChange, label, align = 'left', disabled, className = '' }: {
  value: T
  options: SelectOption<T>[]
  onChange: (v: T) => void
  label: string          // accessible name
  align?: 'left' | 'right'
  disabled?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const items = useRef<(HTMLButtonElement | null)[]>([])
  const current = options.find(o => o.value === value)

  useEffect(() => {
    if (!open) return
    const outside = (e: Event) => { if (!root.current?.contains(e.target as Node)) setOpen(false) }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', outside); document.addEventListener('keydown', key)
    items.current[options.findIndex(o => o.value === value)]?.focus()
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', key) }
  }, [open, options, value])

  function move(i: number, d: number) {
    items.current[(i + d + options.length) % options.length]?.focus()
  }

  return (
    <div ref={root} className={`relative min-w-0 ${className}`}>
      <button type="button" disabled={disabled} aria-label={label} aria-haspopup="listbox" aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 h-8 rounded-full bg-groove text-ink text-small font-display font-semibold pl-3 pr-3 disabled:opacity-60">
        <span className="flex-1 min-w-0 truncate text-left">{current?.label ?? ''}</span>
        <ChevronDown size={14} className={`shrink-0 text-ink-2 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul role="listbox" aria-label={label}
          className={`absolute z-30 mt-1.5 min-w-full w-max max-w-[80vw] bg-surface text-ink rounded-panel shadow-xl border border-groove py-1 ${align === 'right' ? 'right-0' : 'left-0'}`}>
          {options.map((o, i) => (
            <li key={o.value} role="presentation">
              <button type="button" role="option" aria-selected={o.value === value} ref={el => { items.current[i] = el }}
                onClick={() => { onChange(o.value); setOpen(false) }}
                onKeyDown={e => {
                  if (e.key === 'ArrowDown') { e.preventDefault(); move(i, 1) }
                  if (e.key === 'ArrowUp') { e.preventDefault(); move(i, -1) }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-small text-left hover:bg-bg focus:bg-bg outline-none ${o.value === value ? 'text-sea font-semibold' : ''}`}>
                <span className="flex-1 whitespace-nowrap">{o.label}</span>
                {o.value === value && <Check size={14} className="shrink-0" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
