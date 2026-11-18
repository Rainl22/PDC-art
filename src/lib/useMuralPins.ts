'use client'
import { useCallback, useEffect, useRef } from 'react'
import * as maplibregl from 'maplibre-gl'
import { getMuralGradient } from '@/lib/gradients'
import { thumbUrl } from '@/lib/thumb'
import { displayTitle } from '@/lib/format'
import type { Mural } from '@/types/mural'

// Pins are 40px photo circles inside a 44px button; pins closer than this (screen px) are grouped into one count.
export const PIN = 40
const HIT = 44
const HOVER = 52
const SELECTED = 60
const CLUSTER_PX = 48

export const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Draws the mural pins on a MapLibre map: photo circles with a solid status ring (green verified, amber unconfirmed),
 * real <button>s (focusable, labelled), nearby pins grouped into a count (tap zooms in), and a bigger pin for the
 * selected / hovered mural. Shared by the Map page and the desktop Explore map panel.
 */
export function useMuralPins(opts: {
  mapRef: React.MutableRefObject<maplibregl.Map | null>
  ready: boolean
  murals: Mural[]
  activeId?: string | null
  hoverId?: string | null
  onSelect: (m: Mural) => void
}) {
  const { mapRef, ready, murals, activeId, hoverId, onSelect } = opts
  const markers = useRef<maplibregl.Marker[]>([])
  const selectRef = useRef(onSelect)
  selectRef.current = onSelect

  const makePin = useCallback((mural: Mural, state: 'normal' | 'hover' | 'selected') => {
    const size = state === 'selected' ? SELECTED : state === 'hover' ? HOVER : PIN
    const el = document.createElement('button')
    el.type = 'button'
    el.setAttribute('aria-label', [displayTitle(mural.title), mural.artist?.replace(/^@/, '')].filter(Boolean).join(', '))
    el.style.cssText = `width:${Math.max(HIT, size)}px;height:${Math.max(HIT, size)}px;padding:0;border:0;background:none;display:flex;align-items:center;justify-content:center;cursor:pointer;${state !== 'normal' ? 'z-index:5;' : ''}`
    const ring = state === 'selected' ? 'var(--sea)' : mural.confidence === 'verified' ? 'var(--certain)' : 'var(--unconfirmed)'
    const disc = document.createElement('span')
    disc.style.cssText = `display:block;width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;box-sizing:border-box;border:${state === 'selected' ? 4 : 3}px solid ${ring};background:${getMuralGradient(mural.slug)};box-shadow:var(--shadow-2);`
    if (mural.cover_photo) {
      const img = document.createElement('img')
      const full = mural.cover_photo
      img.onerror = () => { img.onerror = null; img.src = full }
      img.src = thumbUrl(full); img.alt = ''; img.loading = 'lazy'; img.decoding = 'async'; img.draggable = false
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;'
      disc.appendChild(img)
    }
    el.appendChild(disc)
    el.addEventListener('click', e => { e.stopPropagation(); selectRef.current(mural) })
    return el
  }, [])

  const makeCluster = useCallback((members: Mural[], map: maplibregl.Map) => {
    const el = document.createElement('button')
    el.type = 'button'
    el.setAttribute('aria-label', `${members.length} murals`)
    el.style.cssText = `width:${HIT}px;height:${HIT}px;padding:0;border:0;background:none;display:flex;align-items:center;justify-content:center;cursor:pointer;`
    const disc = document.createElement('span')
    disc.textContent = String(members.length)
    disc.style.cssText = `display:flex;align-items:center;justify-content:center;width:${PIN}px;height:${PIN}px;border-radius:50%;background:var(--ink);color:var(--on-dark);font:600 16px var(--fb);box-shadow:var(--shadow-2);`
    el.appendChild(disc)
    el.addEventListener('click', e => {
      e.stopPropagation()
      const b = new maplibregl.LngLatBounds()
      members.forEach(m => b.extend([m.coordinates!.lng, m.coordinates!.lat]))
      map.fitBounds(b, { padding: 80, maxZoom: 19, duration: reducedMotion() ? 0 : 500 })
    })
    return el
  }, [])

  const draw = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    markers.current.forEach(m => m.remove())
    markers.current = []
    const used = new Set<string>()
    const pts = murals.filter(m => m.coordinates).map(m => ({ m, p: map.project([m.coordinates!.lng, m.coordinates!.lat]) }))
    // the selected and hovered pins always stand alone
    const solo = (id: string) => id === activeId || id === hoverId
    pts.sort((a, b) => (solo(a.m.id) ? -1 : solo(b.m.id) ? 1 : 0))
    for (const a of pts) {
      if (used.has(a.m.id)) continue
      used.add(a.m.id)
      const group = [a.m]
      if (!solo(a.m.id)) {
        for (const b of pts) {
          if (used.has(b.m.id) || solo(b.m.id)) continue
          if (Math.hypot(a.p.x - b.p.x, a.p.y - b.p.y) < CLUSTER_PX) { group.push(b.m); used.add(b.m.id) }
        }
      }
      const lng = group.reduce((s, g) => s + g.coordinates!.lng, 0) / group.length
      const lat = group.reduce((s, g) => s + g.coordinates!.lat, 0) / group.length
      const state = a.m.id === activeId ? 'selected' : a.m.id === hoverId ? 'hover' : 'normal'
      const el = group.length > 1 ? makeCluster(group, map) : makePin(a.m, state)
      markers.current.push(new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map))
    }
  }, [mapRef, murals, activeId, hoverId, makePin, makeCluster])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    draw()
    map.on('zoomend', draw)   // regroup when the zoom changes (panning doesn't change which pins overlap)
    return () => { map.off('zoomend', draw) }
  }, [draw, ready, mapRef])

  useEffect(() => () => { markers.current.forEach(m => m.remove()) }, [])
}
