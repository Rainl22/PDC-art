'use client'
import { useState } from 'react'
import { Share2, Check } from 'lucide-react'
import { useT } from '@/lib/i18n/client'

/** Round share button on the mural photo: the phone's share sheet, or copies the link where that isn't available. */
export function ShareButton({ title }: { title: string }) {
  const { t } = useT()
  const [copied, setCopied] = useState(false)
  async function share() {
    const url = `${window.location.origin}${window.location.pathname}`
    try {
      if (navigator.share) { await navigator.share({ title, text: t('detail.shareText', { title }), url }); return }
      await navigator.clipboard.writeText(url)
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    } catch { /* share sheet closed */ }
  }
  return (
    <>
      <button type="button" onClick={share} aria-label={t('detail.share')}
        className="absolute top-controls right-gutter w-control h-control rounded-full bg-glass backdrop-blur-sm flex items-center justify-center text-ink shadow-sm">
        {copied ? <Check size={17} /> : <Share2 size={17} />}
      </button>
      {copied && <p role="status" className="absolute top-[calc(var(--inset-top-controls)+var(--control-h)+0.5rem)] right-gutter bg-scrim text-on-dark text-small rounded-full px-3 py-1">{t('detail.shareCopied')}</p>}
    </>
  )
}
