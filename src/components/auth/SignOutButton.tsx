'use client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useT } from '@/lib/i18n/client'

export function SignOutButton() {
  const router = useRouter()
  const { t } = useT()
  return (
    <button onClick={async () => { await createClient().auth.signOut(); router.push('/gallery'); router.refresh() }}
      className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-groove text-ink-2 py-3 text-[13px] font-display font-semibold">
      <LogOut size={15} /> {t('menu.signout')}
    </button>
  )
}
