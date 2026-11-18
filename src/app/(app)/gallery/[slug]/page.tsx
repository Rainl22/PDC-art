import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge'
import { ArtworkBadge } from '@/components/ui/ArtworkBadge'
import { PlaceTags } from '@/components/ui/PlaceTags'
import { LikeButton } from '@/components/mural/LikeButton'
import { TourButton } from '@/components/ui/TourButton'
import { displayTitle, displayPlace } from '@/lib/format'
import { StatusVoting } from '@/components/mural/StatusVoting'
import { CommentForm } from '@/components/mural/CommentForm'
import { LocationPill } from '@/components/ui/LocationPill'
import { isLocationUnknown } from '@/lib/location'
import { ArtistLinks } from '@/components/mural/ArtistLinks'
import { PhotoCredit } from '@/components/mural/PhotoCredit'
import { MuralPager, type PagerMural } from '@/components/mural/MuralPager'
import { PhotoGallery } from '@/components/mural/PhotoGallery'
import { VerifyMenu } from '@/components/mural/VerifyMenu'
import { getMuralGradient } from '@/lib/gradients'
import { getT } from '@/lib/i18n/server'
import { BackButton } from '@/components/ui/BackButton'
import { ShareButton } from '@/components/mural/ShareButton'
import { MapPin, Crosshair, Navigation, Plus, Camera } from 'lucide-react'
import type { Mural, Comment } from '@/types/mural'

export const revalidate = 30

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props) {
  const supabase = createClient()
  const { data } = await supabase.from('murals').select('title,artist,cover_photo,photos,location_description').eq('slug', params.slug).single()
  if (!data) return { title: 'Mural · Murales PDC' }
  const title = `${displayTitle(data.title)}${data.artist ? ` by ${data.artist.replace(/^@/, '')}` : ''} · Murales PDC`
  const description = `${displayTitle(data.title)}: street mural in Playa del Carmen${data.artist ? ` by ${data.artist.replace(/^@/, '')}` : ''}. See the photos, location and more on Murales PDC.`
  // the mural's own photo is the share image (bundled photos are relative paths: metadataBase makes them absolute)
  const photo: string | undefined = data.cover_photo ?? data.photos?.[0]
  const images = photo ? [{ url: photo, alt: data.title }] : [{ url: '/og.png', width: 1200, height: 630 }]
  return {
    title, description,
    openGraph: { title, description, type: 'article', url: `/gallery/${params.slug}`, siteName: 'Murales PDC', images },
    twitter: { card: 'summary_large_image', title, description, images: images.map(i => i.url) },
  }
}

export default async function MuralDetailPage({ params }: Props) {
  const { t, locale } = getT()
  const supabase = createClient()
  const { data: mural } = await supabase
    .from('murals').select('*').eq('slug', params.slug).single()

  if (!mural) notFound()

  const { data: comments } = await supabase
    .from('comments').select('*').eq('mural_id', mural.id)
    .order('created_at', { ascending: false }).limit(50)

  const { data: all } = await supabase.from('murals').select('slug,title,cover_photo').order('title')
  const list = (all ?? []) as PagerMural[]
  const at = list.findIndex(x => x.slug === params.slug)
  const prev = list.length > 1 && at >= 0 ? list[(at - 1 + list.length) % list.length] : null
  const next = list.length > 1 && at >= 0 ? list[(at + 1) % list.length] : null

  const m = mural as Mural
  const c = (comments ?? []) as Comment[]
  const gradient = getMuralGradient(m.slug)

  const gmapsUrl = m.coordinates
    ? `https://www.google.com/maps/search/?api=1&query=${m.coordinates.lat},${m.coordinates.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.location_description + ' Playa del Carmen')}`

  return (
    <div className="bg-surface min-h-dvh">
      {/* hero */}
      <PhotoGallery
        photos={m.photos?.length ? m.photos : m.cover_photo ? [m.cover_photo] : []}
        title={m.title}
        gradient={gradient}
        overlay={
          <>
            <BackButton fallback="/gallery" label={t('detail.back')} />
            <ShareButton title={m.title} />
          </>
        }
      />

      {/* white sheet riding over the photo */}
      <div className="relative -mt-sheet-overlap rounded-t-sheet bg-surface px-gutter pt-5 pb-5 space-y-5">
        <PhotoCredit mural={m} />

        {/* the "Changed" notice sits right under the photos, with its date */}
        {m.artwork_status === 'changed' && (
          <p className="text-13 text-ink-2 bg-unconfirmed-bg rounded-panel px-4 py-3 leading-relaxed">
            {t('detail.changedNote')}{m.artwork_changed_at ? ` (${new Date(m.artwork_changed_at).toLocaleDateString(locale, { month: 'short', year: 'numeric' })})` : ''}
          </p>
        )}

        {/* title row */}
        <div>
          <h1 className="font-display font-extrabold text-28 tracking-tight">{displayTitle(m.title) || t('card.untitled')}</h1>
          <p className="text-sea text-16 font-medium mt-1"><ArtistLinks mural={m} /></p>
        </div>

        {/* main actions: Directions, Add to tour, Save */}
        <div className="flex gap-2">
          {isLocationUnknown(m) ? (
            <Link href={`/submit?mural=${encodeURIComponent(m.slug)}&title=${encodeURIComponent(m.title)}`}
              className="flex-1 min-w-0 h-field rounded-full bg-sea text-on-dark flex items-center justify-center gap-2 text-14 font-semibold">
              <Plus size={16} />{t('detail.addLocation')}
            </Link>
          ) : (
            <a href={gmapsUrl} target="_blank" rel="noopener noreferrer"
              className="flex-1 min-w-0 h-field rounded-full bg-sea text-on-dark flex items-center justify-center gap-2 text-14 font-semibold">
              <Navigation size={16} />{t('map.takeMe')}
            </a>
          )}
          <TourButton muralId={m.id} className="flex-1 min-w-0" />
          <LikeButton muralId={m.id} count={m.like_count ?? 0} />
        </div>

        {/* location, flat rows (no grey box, no tiny uppercase labels) */}
        <div className="space-y-3">
          <div className="flex gap-3">
            <MapPin size={20} className="text-ink-2 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-13 font-semibold text-ink-2">{t('detail.location')}</p>
              <p className="text-16 text-ink">{displayPlace(m) || t('card.locUnconfirmed')}</p>
              {(isLocationUnknown(m) || m.precision === 'lead') && <div className="mt-1.5"><LocationPill mural={m} /></div>}
              {!isLocationUnknown(m) && (m.confidence === 'unverified' || m.confidence === 'likely') && (
                <div className="mt-2"><VerifyMenu slug={m.slug} title={m.title} /></div>
              )}
            </div>
          </div>
          {m.precision && (
            <div className="flex gap-3">
              <Crosshair size={20} className="text-ink-2 mt-0.5 shrink-0" />
              <div>
                <p className="text-13 font-semibold text-ink-2">{t('detail.precision')}</p>
                <p className="text-16 text-ink">{t(`prec.${m.precision}` as 'prec.lead')}</p>
              </div>
            </div>
          )}
          {/* tags: status, changed, where it is, rotating wall */}
          <div className="flex flex-wrap gap-1.5">
            <ConfidenceBadge level={m.confidence} />
            <ArtworkBadge mural={m} />
            <PlaceTags mural={m} />
          </div>
        </div>

        {m.notes && (
          <div>
            <p className="text-14 font-semibold text-ink-2 mb-2">{t('detail.notes')}</p>
            <p className="text-14 text-ink-2 leading-relaxed whitespace-pre-line">{m.notes}</p>
          </div>
        )}

        {/* status voting */}
        <div>
          <p className="text-14 font-semibold text-ink-2 mb-3">{t('detail.stillThere')}</p>
          <StatusVoting muralId={m.id} slug={m.slug} title={m.title} unverified={m.confidence === 'unverified' || m.confidence === 'likely'} />
        </div>

        <Link href={`/submit?mural=${encodeURIComponent(m.slug)}&title=${encodeURIComponent(m.title)}&mode=photos`}
          className="flex items-center justify-center gap-2 min-h-field border border-sea text-sea rounded-full px-4 text-14 font-semibold">
          <Camera size={16} />
          {t('detail.addPhotos')}
        </Link>

        {/* comments */}
        <div>
          <p className="text-13 font-semibold text-ink-2 mb-4">
            {t(c.length === 1 ? 'detail.communityCount.one' : 'detail.communityCount.many', { n: c.length })}
          </p>
          <div className="space-y-4 mb-4">
            {c.length === 0 && (
              <p className="text-14 text-ink-3">{t('detail.noComments')}</p>
            )}
            {c.map(comment => (
              <div key={comment.id} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-groove flex items-center justify-center font-bold text-13 text-ink-2 shrink-0 mt-0.5">
                  {(comment.author_name ?? 'A')[0].toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-13 font-semibold text-ink">{comment.author_name ?? t('detail.anonymous')}</span>
                    <span className="text-13 text-ink-3">
                      {new Date(comment.created_at).toLocaleDateString(locale, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  {comment.body && <p className="text-13 text-ink-2 leading-relaxed">{comment.body}</p>}
                  {comment.status_vote && (
                    <span className="inline-flex items-center gap-1 mt-1.5 text-13 font-semibold px-2.5 py-0.5 rounded-full bg-certain-bg text-certain">
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {comment.status_vote === 'still_here' ? t('vote.stillHereShort') : comment.status_vote === 'removed' ? t('vote.removedShort') : t('vote.unsureShort')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <CommentForm muralId={m.id} />
        </div>


        <MuralPager prev={prev} next={next} />
      </div>
    </div>
  )
}
