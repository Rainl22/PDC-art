'use client'
import { useEffect, useRef } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

maplibregl.setWorkerUrl('/maplibre/maplibre-gl-worker.mjs')

type P = { lat: number; lng: number }

/** Small route preview: numbered stops joined by a dotted line (straight segments, in tour order). */
export default function TourMap({ stops, me, label }: { stops: P[]; me: P | null; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markers = useRef<maplibregl.Marker[]>([])

  useEffect(() => {
    if (!ref.current || mapRef.current) return
    const map = new maplibregl.Map({
      container: ref.current, style: 'https://tiles.openfreemap.org/styles/positron',
      center: [-87.0739, 20.6296], zoom: 14, interactive: false, attributionControl: false,
    })
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')
    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const path: P[] = me ? [me, ...stops] : stops
    const draw = () => {
      markers.current.forEach(m => m.remove()); markers.current = []
      const sea = getComputedStyle(document.documentElement).getPropertyValue('--sea').trim() || '#326A82'
      const line = { type: 'Feature' as const, properties: {}, geometry: { type: 'LineString' as const, coordinates: path.map(p => [p.lng, p.lat]) } }
      const src = map.getSource('route') as maplibregl.GeoJSONSource | undefined
      if (src) src.setData(line)
      else {
        map.addSource('route', { type: 'geojson', data: line })
        map.addLayer({ id: 'route', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': sea, 'line-width': 4, 'line-dasharray': [0.1, 2] } })
      }
      stops.forEach((p, i) => {
        const el = document.createElement('div')
        el.textContent = String(i + 1)
        el.style.cssText = 'width:28px;height:28px;border-radius:50%;background:var(--sea);color:var(--on-dark);font:600 14px var(--fb);display:flex;align-items:center;justify-content:center;border:2px solid var(--on-dark);box-shadow:var(--shadow-1);'
        markers.current.push(new maplibregl.Marker({ element: el }).setLngLat([p.lng, p.lat]).addTo(map))
      })
      if (me) {
        const el = document.createElement('div')
        el.style.cssText = 'width:16px;height:16px;border-radius:50%;background:var(--you);border:3px solid var(--on-dark);box-shadow:var(--shadow-1);'
        markers.current.push(new maplibregl.Marker({ element: el }).setLngLat([me.lng, me.lat]).addTo(map))
      }
      if (path.length) {
        const b = new maplibregl.LngLatBounds()
        path.forEach(p => b.extend([p.lng, p.lat]))
        map.fitBounds(b, { padding: 36, maxZoom: 17, duration: 0 })
      }
    }
    if (map.isStyleLoaded()) draw(); else map.once('load', draw)
  }, [stops, me])

  return <div ref={ref} role="img" aria-label={label} className="w-full h-[180px] rounded-card overflow-hidden bg-groove" />
}
