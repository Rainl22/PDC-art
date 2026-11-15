import { cookies } from 'next/headers'
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, translate, type Key, type Locale } from './dict'

export function getLocale(): Locale {
  const v = cookies().get(LOCALE_COOKIE)?.value
  return isLocale(v) ? v : DEFAULT_LOCALE
}

export function getT() {
  const locale = getLocale()
  return { locale, t: (key: Key, vars?: Record<string, string | number>) => translate(locale, key, vars) }
}
