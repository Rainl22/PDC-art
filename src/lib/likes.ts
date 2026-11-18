'use client'
import { useCallback, useEffect, useState } from 'react'
import { setLike } from '@/lib/murals'

const KEY = 'pdc.likes'
const EVENT = 'pdc-likes-change'
export const readLikes = (): string[] => { try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] } }
const write = (ids: string[]) => { try { localStorage.setItem(KEY, JSON.stringify(ids)) } catch { /* private mode */ } window.dispatchEvent(new Event(EVENT)) }

/** The murals this device has hearted ("Saved"). One heart per device per mural; also counted on the server. */
export function useLikes() {
  const [ids, setIds] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    const read = () => setIds(readLikes())
    read()
    window.addEventListener(EVENT, read); window.addEventListener('storage', read)
    return () => { window.removeEventListener(EVENT, read); window.removeEventListener('storage', read) }
  }, [])

  /** Resolves with the new server total, or null if it failed (and nothing changed). */
  const toggle = useCallback(async (id: string): Promise<number | null> => {
    if (busy) return null
    const next = !readLikes().includes(id)
    setBusy(true)
    try {
      const total = await setLike(id, next)
      write(next ? Array.from(new Set(readLikes().concat(id))) : readLikes().filter(x => x !== id))
      return total
    } catch { return null } finally { setBusy(false) }
  }, [busy])

  return { ids, has: (id: string) => ids.includes(id), toggle, busy }
}
