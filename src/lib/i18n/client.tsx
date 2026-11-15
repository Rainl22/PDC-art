'use client'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DEFAULT_LOCALE, LOCALE_COOKIE, translate, type Key, type Locale } from './dict'

interface Ctx { locale: Locale; setLocale: (l: Locale) => void; t: (key: Key, vars?: Record<string, string | number>) => string }
const LocaleContext = createContext<Ctx>({ locale: DEFAULT_LOCALE, setLocale: () => {}, t: (k, v) => translate(DEFAULT_LOCALE, k, v) })

export function LocaleProvider({ initial, children }: { initial: Locale; children: React.ReactNode }) {
  const router = useRouter()
  const [locale, set] = useState<Locale>(initial)
  const setLocale = useCallback((l: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`
    document.documentElement.lang = l
    set(l)
    router.refresh() // re-render server components in the new language
  }, [router])
  const value = useMemo<Ctx>(() => ({ locale, setLocale, t: (k, v) => translate(locale, k, v) }), [locale, setLocale])
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export const useT = () => useContext(LocaleContext)
