'use client'
import { useEffect, useState } from 'react'
import { useT } from '@/lib/i18n/client'
import { LOCALES } from '@/lib/i18n/dict'

/** ES / EN switch for the landing nav (the same cookie the app uses). */
export function LangToggle() {
  const { locale, setLocale } = useT()
  return (
    <div className="lang" role="group" aria-label="Language / Idioma">
      {LOCALES.map(l => (
        <button key={l} type="button" aria-pressed={locale === l} onClick={() => setLocale(l)}>{l.toUpperCase()}</button>
      ))}
    </div>
  )
}

type InstallEvent = Event & { prompt: () => Promise<void> }

/** Install hint: a button on Android/Chrome, Share → Add to Home Screen on iPhone, nothing when already installed. */
export function InstallHint({ labels }: { labels: { button: string; ios: string } }) {
  const [ev, setEv] = useState<InstallEvent | null>(null)
  const [ios, setIos] = useState(false)
  const [installed, setInstalled] = useState(true) // hidden until we know
  useEffect(() => {
    setInstalled(window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true)
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent))
    const onPrompt = (e: Event) => { e.preventDefault(); setEv(e as InstallEvent) }
    const onDone = () => { setInstalled(true); setEv(null) }
    window.addEventListener('beforeinstallprompt', onPrompt); window.addEventListener('appinstalled', onDone)
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onDone) }
  }, [])
  if (installed) return null
  if (ev) return <button type="button" className="install" onClick={() => ev.prompt()}>{labels.button}</button>
  if (ios) return <p className="install-ios">{labels.ios}</p>
  return null
}
