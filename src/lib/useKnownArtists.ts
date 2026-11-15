'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/** Artist names already in the database, for autocomplete suggestions. */
export function useKnownArtists(): string[] {
  const [names, setNames] = useState<string[]>([])
  useEffect(() => {
    createClient().from('murals').select('artist,artists').then(({ data }) => {
      const set = new Map<string, string>()
      const add = (n?: string | null) => { const v = n?.trim(); if (v && v.length < 80) set.set(v.toLowerCase(), v) }
      for (const m of (data ?? []) as { artist: string | null; artists: { name: string }[] | null }[]) {
        if (m.artists?.length) m.artists.forEach(a => add(a.name))
        else m.artist?.split(',').forEach(add)
      }
      setNames(Array.from(set.values()).sort((a, b) => a.localeCompare(b)))
    })
  }, [])
  return names
}
