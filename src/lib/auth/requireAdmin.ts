import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/** Server-side gate for admin pages. RLS enforces the same rule on every write. */
export async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/signin?next=/admin')
  const { data: ok } = await supabase.rpc('is_admin')
  if (ok !== true) redirect('/profile')
  return { supabase, user }
}
