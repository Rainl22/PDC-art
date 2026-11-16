'use client'
import { useState } from 'react'
import { Loader2, MapPin, ExternalLink } from 'lucide-react'
import { geocodeAddress, looksUnknown, type GeoCandidate } from '@/lib/geocode'
import { ghostBtn, primaryBtn } from './fields'
import type { Coordinates, PrecisionLabel } from '@/types/mural'

/** Admin helper: look up approximate coordinates from the written address; you review each result before using it. */
export function AddressLocator({ address, onPick }: { address: string; onPick: (c: Coordinates, precision: PrecisionLabel) => void }) {
  const [busy, setBusy] = useState(false)
  const [results, setResults] = useState<GeoCandidate[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function find() {
    setBusy(true); setError(null); setResults(null)
    try {
      const r = await geocodeAddress(address)
      setResults(r)
      if (r.length === 0) setError(looksUnknown(address) ? 'The address is too vague to look up. Add a street or corner first.' : 'No match found. Try a clearer address, or use my location / a map link.')
    } catch { setError('Lookup failed. Check your connection and try again.') }
    finally { setBusy(false) }
  }

  return (
    <div className="space-y-2">
      <button type="button" className={ghostBtn} disabled={busy || looksUnknown(address)} onClick={find}>
        {busy ? <Loader2 size={12} className="inline animate-spin -mt-0.5" /> : <MapPin size={12} className="inline -mt-0.5" />} Find on map from address
      </button>
      {error && <p className="text-caption text-guessing">{error}</p>}
      {results && results.length > 0 && (
        <ul className="space-y-1.5">
          {results.map((c, i) => (
            <li key={i} className="flex items-center gap-2 bg-bg rounded-card px-3 py-2 text-small text-ink-2">
              <span className="flex-1 min-w-0">
                <span className="block truncate">{c.label}</span>
                <span className="text-caption text-ink-3">{c.coords.lat.toFixed(5)}, {c.coords.lng.toFixed(5)} · approximate ({c.precision})</span>
              </span>
              <a href={`https://www.google.com/maps/search/?api=1&query=${c.coords.lat},${c.coords.lng}`} target="_blank" rel="noopener noreferrer" aria-label="Check on Google Maps" className="text-sea"><ExternalLink size={13} /></a>
              <button type="button" className={primaryBtn} onClick={() => { onPick(c.coords, c.precision); setResults(null) }}>Use</button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-caption text-ink-3">Addresses give an approximate pin (the status stays unverified until someone confirms it on the spot).</p>
    </div>
  )
}
