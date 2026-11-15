import { SubmitForm } from '@/components/mural/SubmitForm'
import { MenuButton } from '@/components/layout/SideMenu'
import { getT } from '@/lib/i18n/server'

export const metadata = { title: 'Submit a mural — Murales PDC' }

export default function SubmitPage({ searchParams }: { searchParams: { mural?: string; title?: string; mode?: string } }) {
  const { t } = getT()
  const existing = searchParams.mural ? { slug: searchParams.mural, title: searchParams.title ?? searchParams.mural } : null
  const photosMode = !!existing && searchParams.mode === 'photos'
  return (
    <main className="px-4 pt-safe-or-12 pb-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <MenuButton />
        <h1 className="font-display text-2xl font-bold text-ink">{photosMode ? t('submit.addPhotosTitle') : existing ? t('submit.addLocationTitle') : t('submit.title')}</h1>
      </div>
      <p className="text-[13px] text-ink-2 mt-3 mb-5">
        {photosMode ? t('submit.introPhotos', { title: existing!.title }) : existing ? t('submit.introLocation', { title: existing.title }) : t('submit.intro')}
      </p>
      <SubmitForm existing={existing} photosMode={photosMode} />
    </main>
  )
}
