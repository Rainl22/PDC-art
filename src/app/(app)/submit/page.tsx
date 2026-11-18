import { SubmitForm } from '@/components/mural/SubmitForm'
import { getT } from '@/lib/i18n/server'

export const metadata = { title: 'Submit a mural — Murales PDC' }

export default function SubmitPage({ searchParams }: { searchParams: { mural?: string; title?: string; mode?: string } }) {
  const { t } = getT()
  const existing = searchParams.mural ? { slug: searchParams.mural, title: searchParams.title ?? searchParams.mural } : null
  const mode = existing && (searchParams.mode === 'photos' || searchParams.mode === 'verify' || searchParams.mode === 'update') ? searchParams.mode : undefined
  return (
    <main className="relative px-gutter pt-controls pb-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3 min-h-control">
        <h1 className="flex-1 min-w-0 font-display font-extrabold text-28 text-ink">{mode === 'update' ? t('submit.updateTitle') : mode === 'photos' ? t('submit.addPhotosTitle') : mode === 'verify' ? t('submit.verifyTitle') : existing ? t('submit.addLocationTitle') : t('submit.title')}</h1>
      </div>
      <p className="text-14 text-ink-2 mt-3 mb-5">
        {mode === 'update' ? t('submit.introUpdate', { title: existing!.title }) : mode === 'photos' ? t('submit.introPhotos', { title: existing!.title }) : mode === 'verify' ? t('submit.introVerify', { title: existing!.title }) : existing ? t('submit.introLocation', { title: existing.title }) : t('submit.intro')}
      </p>
      <SubmitForm existing={existing} mode={mode} />
    </main>
  )
}
