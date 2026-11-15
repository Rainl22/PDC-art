'use client'
import { useState } from 'react'
import { Crosshair, Link2, X, ExternalLink, Loader2 } from 'lucide-react'
import { isNearPlaya, parseMapCoords } from '@/lib/geo'
import { useT } from '@/lib/i18n/client'
import type { Coordinates } from '@/types/mural'

export type LocationSource = 'link' | 'device' | 'photo'

interface Props {
  coords: Coordinates | null
  source: LocationSource | null
  onChange: (coords: Coordinates | null, source: LocationSource | null) => void
}

const SOURCE_KEY = { link: 'locpick.fromLink', device: 'locpick.fromDevice', photo: 'locpick.fromPhoto' } as const
const btn = 'flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-sea text-sea px-3 py-2 text-[12px] font-display font-semibold disabled:opacity-40'
const field = 'w-full text-[13px] bg-surface rounded-md px-3 py-2.5 outline-none border border-groove focus:border-sea placeholder:text-ink-3'

export function LocationPicker({ coords, source, onChange }: Props) {
  const { t } = useT()
  const [busy, setBusy] = useState<'device' | 'link' | null>(null)
  const [showLink, setShowLink] = useState(false)
  const [link, setLink] = useState('')
  const [error, setError] = useState<string | null>(null)

  function useDevice() {
    setError(null)
    if (!('geolocation' in navigator)) { setError(t('locpick.errNoGeo')); return }
    setBusy('device')
    navigator.geolocation.getCurrentPosition(
      pos => { setBusy(null); onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude }, 'device') },
      err => {
        setBusy(null)
        setError(err.code === err.PERMISSION_DENIED
          ? t('locpick.errDenied')
          : t('locpick.errFail'))
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    )
  }

  async function resolveLink() {
    setError(null)
    const text = link.trim()
    if (!text) return
    const local = parseMapCoords(text)
    if (local) { onChange(local, 'link'); setLink(''); setShowLink(false); return }
    setBusy('link')
    try {
      const res = await fetch('/api/resolve-map-link', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: text }),
      })
      const data = await res.json()
      if (!res.ok || !data.coordinates) throw new Error(data.error ?? 'No pin found.')
      onChange(data.coordinates, 'link'); setLink(''); setShowLink(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Couldn’t read that link.')
    } finally { setBusy(null) }
  }

  return (
    <div className="space-y-2">
      {coords ? (
        <div className="bg-sea-tint text-sea rounded-md px-3 py-2.5 text-[12px] flex items-start gap-2">
          <Crosshair size={14} className="mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-display font-semibold">{t('locpick.pinSet')} {source ? t(SOURCE_KEY[source]) : ''}</p>
            <p className="text-sea-dark">{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</p>
            {!isNearPlaya(coords) && (
              <p className="text-guessing mt-1">{t('locpick.far')}</p>
            )}
            <a href={`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`}
              target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline underline-offset-2 mt-1">
              {t('locpick.checkMaps')} <ExternalLink size={11} />
            </a>
          </div>
          <button type="button" aria-label={t('locpick.removePin')} onClick={() => onChange(null, null)} className="p-1 -m-1">
            <X size={15} />
          </button>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <button type="button" className={btn} onClick={useDevice} disabled={busy !== null}>
              {busy === 'device' ? <Loader2 size={13} className="animate-spin" /> : <Crosshair size={13} />}
              {t('locpick.useMine')}
            </button>
            <button type="button" className={btn} onClick={() => setShowLink(s => !s)} aria-expanded={showLink}>
              <Link2 size={13} /> {t('locpick.pasteLink')}
            </button>
          </div>
          {showLink && (
            <div className="space-y-1.5">
              <div className="flex gap-2">
                <input className={field} inputMode="url" placeholder={t('locpick.linkPh')}
                  value={link} onChange={e => setLink(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); resolveLink() } }} />
                <button type="button" onClick={resolveLink} disabled={!link.trim() || busy !== null}
                  className="shrink-0 rounded-full bg-sea text-white px-4 text-[12px] font-display font-semibold disabled:opacity-40">
                  {busy === 'link' ? <Loader2 size={13} className="animate-spin" /> : t('locpick.getPin')}
                </button>
              </div>
              <p className="text-[11px] text-ink-3">{t('locpick.linkHint')}</p>
            </div>
          )}
        </>
      )}
      {error && <p className="text-[12px] text-guessing" role="alert">{error}</p>}
    </div>
  )
}
