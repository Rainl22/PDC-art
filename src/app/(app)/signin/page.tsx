import { Logo } from '@/components/brand/Logo'
import { SignInForm } from '@/components/auth/SignInForm'
import { MenuButton } from '@/components/layout/SideMenu'
import { getT } from '@/lib/i18n/server'

export const metadata = { title: 'Sign in · Murales PDC' }

export default function SignInPage({ searchParams }: { searchParams: { next?: string; error?: string } }) {
  const { t } = getT()
  return (
    <main className="px-gutter pt-controls pb-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3 min-h-control">
        <Logo size={36} />
        <h1 className="flex-1 min-w-0 font-display font-extrabold text-28 text-ink">{t('auth.title')}</h1>
        <MenuButton />
      </div>
      <p className="text-14 text-ink-2 mt-3 mb-5">{t('auth.intro')}</p>
      {searchParams.error === 'callback' && (
        <p className="text-13 text-danger mb-3" role="alert">{t('auth.callbackError')}</p>
      )}
      {searchParams.error === 'notadmin' && (
        <p className="text-13 text-danger mb-3" role="alert">{t('auth.adminOnly')}</p>
      )}
      <SignInForm next={searchParams.next} />
    </main>
  )
}
