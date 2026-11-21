'use client'
import { track } from '@/lib/track'

/** "Take me there" link on a mural page. Client component so the tap can be counted. */
export function DirectionsLink({ href, slug, className, children }: { href: string; slug: string; className?: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} onClick={() => track('directions_tapped', `/gallery/${slug}`)}>
      {children}
    </a>
  )
}
