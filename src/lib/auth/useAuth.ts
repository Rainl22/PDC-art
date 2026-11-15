'use client'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

export interface AuthState { loading: boolean; user: User | null; isAdmin: boolean }

/** Current (optional) session + whether the user is on the admin allowlist. */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ loading: true, user: null, isAdmin: false })
  useEffect(() => {
    const sb = createClient()
    let alive = true
    async function load() {
      const { data: { user } } = await sb.auth.getUser()
      let isAdmin = false
      if (user) {
        const { data, error } = await sb.rpc('is_admin')
        isAdmin = !error && data === true
      }
      if (alive) setState({ loading: false, user, isAdmin })
    }
    load()
    const { data: sub } = sb.auth.onAuthStateChange(() => { load() })
    return () => { alive = false; sub.subscription.unsubscribe() }
  }, [])
  return state
}
