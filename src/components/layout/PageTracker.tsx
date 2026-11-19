'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { initTracking, trackPageView } from '@/lib/track'

/** Records one page view per screen. Effects run in order, so the source is worked out before the first view is sent. */
export function PageTracker() {
  const path = usePathname()
  useEffect(() => { initTracking() }, [])
  useEffect(() => { trackPageView() }, [path])
  return null
}
