'use client'
import { useEffect, useState, useCallback } from 'react'

const KEY = 'murales-pdc-tour'

export function getTourIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

export function saveTourIds(ids: string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids))
  } catch {}
  notify()
}

export function clearTour(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {}
  notify()
}

/** Google Maps accepts an origin + destination + up to 9 waypoints. */
export const MAX_ROUTE_STOPS = 11

/** Walking directions through the stops. With `fromMyLocation` the origin is left out, so Google Maps starts from where you are
 *  (one fewer stop fits, because the origin slot is free for you, not for a mural). */
export function buildGoogleMapsUrl(
  stops: { lat: number; lng: number }[],
  fromMyLocation = false,
): string | null {
  if (stops.length < (fromMyLocation ? 1 : 2)) return null
  stops = stops.slice(0, fromMyLocation ? MAX_ROUTE_STOPS - 1 : MAX_ROUTE_STOPS)
  const pt = (s: { lat: number; lng: number }) => `${s.lat},${s.lng}`
  const dest = pt(stops[stops.length - 1])
  const middle = stops.slice(fromMyLocation ? 0 : 1, -1).map(pt).join('|')
  const origin = fromMyLocation ? '' : `&origin=${pt(stops[0])}`
  return `https://www.google.com/maps/dir/?api=1${origin}&destination=${dest}${middle ? `&waypoints=${middle}` : ''}&travelmode=walking`
}

/** Greedy nearest-neighbour order, starting from `start` (or the first stop). Good enough for a handful of murals. */
export function shortestOrder<T extends { coordinates: { lat: number; lng: number } | null }>(
  stops: T[], start: { lat: number; lng: number } | null, dist: (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => number,
): T[] {
  const withPin = stops.filter(s => s.coordinates)
  const noPin = stops.filter(s => !s.coordinates)
  if (withPin.length < 2) return stops
  const left = [...withPin]
  const out: T[] = []
  let cur = start ?? left.shift()!.coordinates!
  if (!start) { out.push(withPin[0]) }
  while (left.length) {
    let bi = 0, bd = Infinity
    left.forEach((s, i) => { const d = dist(cur, s.coordinates!); if (d < bd) { bd = d; bi = i } })
    const [next] = left.splice(bi, 1)
    out.push(next); cur = next.coordinates!
  }
  return [...out, ...noPin]
}

/* ---- shared tour state (localStorage + a change event, so the tray, the tab badge and every "Add to tour" button stay in sync) ---- */
const EVENT = 'murales-pdc-tour-change'

function notify() {
  try { window.dispatchEvent(new Event(EVENT)) } catch {}
}

export const setTourIds = saveTourIds

export function useTour() {
  // start empty on the server and the first client render so hydration matches
  const [ids, setIds] = useState<string[]>([])
  useEffect(() => {
    const read = () => setIds(getTourIds())
    read()
    window.addEventListener(EVENT, read)
    window.addEventListener('storage', read)
    return () => { window.removeEventListener(EVENT, read); window.removeEventListener('storage', read) }
  }, [])
  const has = useCallback((id: string) => ids.includes(id), [ids])
  const add = useCallback((id: string) => { const cur = getTourIds(); if (!cur.includes(id)) setTourIds([...cur, id]) }, [])
  const remove = useCallback((id: string) => setTourIds(getTourIds().filter(x => x !== id)), [])
  const toggle = useCallback((id: string) => (getTourIds().includes(id) ? remove(id) : add(id)), [add, remove])
  return { ids, count: ids.length, has, add, remove, toggle }
}
