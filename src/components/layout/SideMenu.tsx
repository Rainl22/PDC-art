'use client'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { X, LogIn, LogOut, UserRound, ShieldCheck, FileText, Lock, Languages, Download } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { useT } from '@/lib/i18n/client'
import { LOCALES, type Locale } from '@/lib/i18n/dict'
import { useAuth } from '@/lib/auth/useAuth'
import { createClient } from '@/lib/supabase/client'

const MenuCtx = createContext<{ open: () => void }>({ open: () => {} })
export const useMenu = () => useContext(MenuCtx)

const LANG_LABEL: Record<Locale, string> = { en: 'English', es: 'Español' }
const row = 'flex items-center gap-3 px-5 py-3 text-body text-ink hover:bg-bg transition-colors'

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setOpen] = useState(false)
  const open = useCallback(() => setOpen(true), [])
  const close = useCallback(() => setOpen(false), [])
  const path = usePathname()
  const router = useRouter()
  const { t, locale, setLocale } = useT()
  const { user, isAdmin, loading } = useAuth()

  // "Install the app": opens full screen without the browser bar. Chrome/Android gives us an install prompt;
  // iPhone only has Share → Add to Home Screen; other browsers have it in their own menu.
  type InstallEvent = Event & { prompt: () => Promise<void> }
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null)
  const [installed, setInstalled] = useState(true)   // hide until we know
  const [ios, setIos] = useState(false)
  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true
    setInstalled(standalone)
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent))
    const onPrompt = (e: Event) => { e.preventDefault(); setInstallEvent(e as InstallEvent) }
    const onInstalled = () => { setInstalled(true); setInstallEvent(null) }
    window.addEventListener('beforeinstallprompt', onPrompt); window.addEventListener('appinstalled', onInstalled)
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled) }
  }, [])

  useEffect(() => { setOpen(false) }, [path])
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [isOpen, close])

  async function signOut() {
    await createClient().auth.signOut()
    close()
    router.refresh()
  }

  return (
    <MenuCtx.Provider value={{ open }}>
      {children}
      <div className={`fixed inset-0 z-[70] ${isOpen ? '' : 'pointer-events-none'}`} aria-hidden={!isOpen}>
        <div onClick={close} className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`} />
        <aside role="dialog" aria-modal="true" aria-label={t('menu.open')}
          className={`absolute inset-y-0 left-0 w-[84%] max-w-xs bg-surface shadow-xl flex flex-col transition-transform duration-200 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {/* brand */}
          <div className="flex items-center gap-3 px-5 pt-safe-or-12 pb-4 border-b border-groove">
            <Logo size={40} />
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-[16px] leading-tight">Murales PDC</p>
              <p className="text-caption text-ink-3">{t('menu.tagline')}</p>
            </div>
            <button onClick={close} aria-label={t('menu.close')} className="w-9 h-9 -mr-2 rounded-full flex items-center justify-center text-ink-2 hover:bg-bg">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {/* language */}
            <div className="px-5 py-3">
              <p className="flex items-center gap-1.5 text-[10px] font-display font-bold uppercase tracking-wider text-ink-3 mb-2">
                <Languages size={12} /> {t('menu.language')}
              </p>
              <div className="flex gap-2" role="group" aria-label={t('menu.language')}>
                {LOCALES.map(l => (
                  <button key={l} onClick={() => setLocale(l)} aria-pressed={locale === l}
                    className={`flex-1 rounded-full py-2 text-[13px] font-display font-semibold transition-colors
                      ${locale === l ? 'bg-sea text-white' : 'bg-groove text-ink-2 hover:bg-groove/80'}`}>
                    {LANG_LABEL[l]}
                  </button>
                ))}
              </div>
            </div>

            {!installed && (
              <>
                <div className="h-px bg-groove mx-5 my-2" />
                <div className="px-5 py-3">
                  {installEvent ? (
                    <button onClick={() => installEvent.prompt()} className="w-full flex items-center gap-3 rounded-full bg-sea-tint text-sea px-4 py-2.5 text-[13px] font-display font-semibold">
                      <Download size={16} />{t('menu.install')}
                    </button>
                  ) : (
                    <p className="flex items-center gap-2 text-[13px] font-display font-semibold text-ink"><Download size={16} className="text-sea" />{t('menu.install')}</p>
                  )}
                  <p className="text-caption text-ink-3 leading-snug mt-1.5">{installEvent ? t('menu.installHint') : ios ? t('menu.installIos') : t('menu.installMenu')}</p>
                </div>
              </>
            )}

            <div className="h-px bg-groove mx-5 my-2" />

            {/* account */}
            <div className="py-1">
              <p className="px-5 pt-2 pb-1 text-[10px] font-display font-bold uppercase tracking-wider text-ink-3">{t('menu.account')}</p>
              {!loading && user ? (
                <>
                  <p className="px-5 pb-1 text-caption text-ink-3 truncate">{t('menu.signedInAs')} {user.email}</p>
                  <Link href="/profile" className={row}><UserRound size={16} className="text-ink-3" />{t('menu.profile')}</Link>
                  {isAdmin && <Link href="/admin" className={row}><ShieldCheck size={16} className="text-sea" />{t('menu.admin')}</Link>}
                  <button onClick={signOut} className={`${row} w-full text-left`}><LogOut size={16} className="text-ink-3" />{t('menu.signout')}</button>
                </>
              ) : (
                <>
                  <Link href="/signin" className={row}><LogIn size={16} className="text-ink-3" />{t('menu.signin')}</Link>
                  <p className="px-5 text-caption text-ink-3 leading-snug">{t('menu.signinHint')}</p>
                </>
              )}
            </div>

            <div className="h-px bg-groove mx-5 my-3" />

            <Link href="/privacy" className={row}><Lock size={16} className="text-ink-3" />{t('menu.privacy')}</Link>
            <Link href="/terms" className={row}><FileText size={16} className="text-ink-3" />{t('menu.terms')}</Link>
          </div>
        </aside>
      </div>
    </MenuCtx.Provider>
  )
}

/** The logo, top-left of every main screen — opens the side menu. */
export function MenuButton({ className = '' }: { className?: string }) {
  const { open } = useMenu()
  const { t } = useT()
  return (
    <button onClick={open} aria-label={t('menu.open')} className={`shrink-0 rounded-lg active:scale-95 transition-transform ${className}`}>
      <Logo size={34} />
    </button>
  )
}
