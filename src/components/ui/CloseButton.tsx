'use client'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'

/** Round X in the top-right corner: back to the previous screen (or `fallback` when the page was opened directly). */
export function CloseButton({ fallback, label = 'Close', className = 'absolute right-gutter top-controls' }: { fallback: string; label?: string; className?: string }) {
  const router = useRouter()
  return (
    <button type="button" aria-label={label}
      onClick={() => (window.history.length > 1 ? router.back() : router.push(fallback))}
      className={`${className} w-control h-control rounded-full bg-groove text-ink-2 flex items-center justify-center shrink-0`}>
      <X size={16} />
    </button>
  )
}
