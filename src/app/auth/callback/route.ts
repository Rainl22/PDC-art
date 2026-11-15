import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Completes the email sign-in link (PKCE code exchange), then returns to the app. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/profile'
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/profile'
  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }
  return NextResponse.redirect(`${origin}/signin?error=callback`)
}
