/** Readable text for any thrown value (Supabase errors are plain objects, not Error instances). */
export function errMsg(e: unknown, fallback = 'Something went wrong'): string {
  if (e instanceof Error && e.message) return e.message
  if (e && typeof e === 'object') {
    const o = e as { message?: string; details?: string; hint?: string; code?: string }
    const text = [o.message, o.details, o.hint].filter(Boolean).join(' — ')
    if (text) return o.code ? `${text} (${o.code})` : text
  }
  return typeof e === 'string' && e ? e : fallback
}
