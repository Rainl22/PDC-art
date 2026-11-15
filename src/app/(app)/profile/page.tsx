import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { MenuButton } from '@/components/layout/SideMenu'
import { SignOutButton } from '@/components/auth/SignOutButton'
import { getT } from '@/lib/i18n/server'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'My profile · Murales PDC' }

export default async function ProfilePage() {
  const { t } = getT()
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/signin?next=/profile')
  const { data: isAdmin } = await supabase.rpc('is_admin')

  return (
    <main className="px-4 pt-safe-or-12 pb-6 max-w-lg mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <MenuButton />
        <h1 className="font-display text-2xl font-bold text-ink">{t('profile.title')}</h1>
      </div>

      <div className="bg-surface rounded-xl p-4 space-y-3">
        <div>
          <p className="text-[9px] font-display font-bold uppercase tracking-wider text-ink-3 mb-1">{t('profile.email')}</p>
          <p className="text-[13px] text-ink break-all">{user.email}</p>
        </div>
        <div>
          <p className="text-[9px] font-display font-bold uppercase tracking-wider text-ink-3 mb-1">{t('profile.role')}</p>
          <p className="text-[13px] text-ink">{isAdmin === true ? t('profile.roleAdmin') : t('profile.roleUser')}</p>
        </div>
      </div>

      {isAdmin === true && (
        <div className="bg-sea-tint rounded-xl p-4">
          <p className="flex items-center gap-2 font-display font-semibold text-sea text-[14px]"><ShieldCheck size={16} />{t('profile.adminArea')}</p>
          <p className="text-[12px] text-ink-2 mt-1 mb-3">{t('profile.adminBody')}</p>
          <Link href="/admin" className="inline-flex rounded-full bg-sea text-white px-4 py-2 text-[13px] font-display font-semibold">
            {t('profile.openAdmin')}
          </Link>
        </div>
      )}

      <SignOutButton />
    </main>
  )
}
