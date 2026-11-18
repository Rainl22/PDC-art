'use client'
import { thumbUrl } from '@/lib/thumb'

/** A photo shown small: loads the `-t.jpg` copy and falls back to the full photo if that copy doesn't exist (older uploads). */
export function ThumbImg({ src, alt, className, eager, ...rest }: { src: string; alt: string; className?: string; eager?: boolean } & Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'className'>) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={thumbUrl(src)} alt={alt} className={className} loading={eager ? 'eager' : 'lazy'} decoding="async" draggable={false}
      onError={e => { const el = e.currentTarget; if (el.getAttribute('src') !== src) el.src = src }} {...rest} />
  )
}
