import { SignInForm } from '@/components/auth/SignInForm'
import { MenuButton } from '@/components/layout/SideMenu'
import { getT } from '@/lib/i18n/server'

export const metadata = { title: 'Sign in · Murales PDC' }

export default function SignInPage({ searchParams }: { searchParams: { next?: string; error?: string } }) {
  const { t } = getT()
  return (
    <main className="px-gutter pt-controls pb-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3 min-h-control">
        <MenuButton />
        <h1 className="font-display text-2xl font-bold text-ink">{t('auth.title')}</h1>
      </div>
      <p className="text-[13px] text-ink-2 mt-3 mb-5">{t('auth.intro')}</p>
      {searchParams.error === 'callback' && (
        <p className="text-small text-guessing mb-3" role="alert">{t('auth.callbackError')}</p>
      )}
      <SignInForm next={searchParams.next} />
    </main>
  )
}
