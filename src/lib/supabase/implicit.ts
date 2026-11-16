import { createClient } from '@supabase/supabase-js'

/**
 * Client used only for the emailed sign-in link. The app's normal client (@supabase/ssr) is locked to the PKCE flow,
 * which only works when the link is opened in the same browser that asked for it. On a phone the email app often opens
 * links in a different browser, so the emailed link uses the implicit flow instead; /auth/finish then hands the session
 * to the normal client. Google sign-in keeps using the normal PKCE client.
 */
export function createImplicitClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { flowType: 'implicit', persistSession: false, autoRefreshToken: false, detectSessionInUrl: true },
  })
}
