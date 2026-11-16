import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Completes the email sign-in link (PKCE code exchange), then returns to the app. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next')
  const explicit = rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : null
  const supabase = createClient()
  // already signed in (link or page opened again): carry on instead of showing an error
  const { data: { user } } = await supabase.auth.getUser()
  if (code && !user) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) return NextResponse.redirect(`${origin}/signin?error=callback`)
  } else if (!user) {
    return NextResponse.redirect(`${origin}/signin?error=callback`)
  }
  if (explicit) return NextResponse.redirect(`${origin}${explicit}`)
  const { data: admin } = await supabase.rpc('is_admin')
  return NextResponse.redirect(`${origin}${admin === true ? '/admin' : '/profile'}`)
}
