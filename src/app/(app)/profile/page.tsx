import { Logo } from '@/components/brand/Logo'
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
    <main className="px-gutter pt-controls pb-6 max-w-lg mx-auto space-y-5">
      <div className="flex items-center gap-3 min-h-control">
        <Logo size={36} />
        <h1 className="flex-1 min-w-0 font-display font-extrabold text-28 text-ink">{t('profile.title')}</h1>
        <MenuButton />
      </div>

      <div className="bg-surface rounded-sheet p-4 space-y-3">
        <div>
          <p className="text-12 font-semibold text-ink-2 mb-1">{t('profile.email')}</p>
          <p className="text-14 text-ink break-all">{user.email}</p>
        </div>
        <div>
          <p className="text-12 font-semibold text-ink-2 mb-1">{t('profile.role')}</p>
          <p className="text-14 text-ink">{isAdmin === true ? t('profile.roleAdmin') : t('profile.roleUser')}</p>
        </div>
      </div>

      {isAdmin === true && (
        <div className="bg-sea-tint rounded-sheet p-4">
          <p className="flex items-center gap-2 font-semibold text-sea text-14"><ShieldCheck size={16} />{t('profile.adminArea')}</p>
          <p className="text-13 text-ink-2 mt-1 mb-3">{t('profile.adminBody')}</p>
          <Link href="/admin" className="inline-flex rounded-full bg-sea text-on-dark px-4 py-2 text-14 font-semibold">
            {t('profile.openAdmin')}
          </Link>
        </div>
      )}

      <SignOutButton />
    </main>
  )
}
