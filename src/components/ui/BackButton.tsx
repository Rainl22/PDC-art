'use client'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

/** Back to wherever the person came from (e.g. the admin area); `fallback` when the page was opened directly. */
export function BackButton({ fallback, label }: { fallback: string; label: string }) {
  const router = useRouter()
  return (
    <button type="button" aria-label={label}
      onClick={() => (window.history.length > 1 ? router.back() : router.push(fallback))}
      className="absolute top-controls left-gutter w-control h-control rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center text-ink shadow-sm">
      <ChevronLeft size={18} />
    </button>
  )
}
