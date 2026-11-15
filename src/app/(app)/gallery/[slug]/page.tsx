import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge'
import { StatusVoting } from '@/components/mural/StatusVoting'
import { CommentForm } from '@/components/mural/CommentForm'
import { LocationPill } from '@/components/ui/LocationPill'
import { isLocationUnknown } from '@/lib/location'
import { ArtistLinks } from '@/components/mural/ArtistLinks'
import { PhotoCredit } from '@/components/mural/PhotoCredit'
import { MuralPager, type PagerMural } from '@/components/mural/MuralPager'
import { PhotoGallery } from '@/components/mural/PhotoGallery'
import { getMuralGradient } from '@/lib/gradients'
import { getT } from '@/lib/i18n/server'
import { ChevronLeft, MapPin, Crosshair, Eye, ExternalLink, Plus } from 'lucide-react'
import type { Mural, Comment } from '@/types/mural'

export const revalidate = 30

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props) {
  const supabase = createClient()
  const { data } = await supabase.from('murals').select('title,artist').eq('slug', params.slug).single()
  if (!data) return { title: 'Mural · Murales PDC' }
  return {
    title: `${data.title}${data.artist ? ` by ${data.artist}` : ''} · Murales PDC`,
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
  const totalVotes = m.still_here_count + m.removed_count + m.unsure_count

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
        overlay={<>
          <Link href="/gallery"
            className="absolute top-safe-or-12 left-4 w-9 h-9 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center text-ink shadow-sm">
            <ChevronLeft size={18} />
          </Link>
          <div className="absolute top-safe-or-12 right-4">
            <ConfidenceBadge level={m.confidence} />
          </div>
        </>}
      />

      <PhotoCredit mural={m} />

      {/* content */}
      <div className="px-5 py-5 space-y-5">

        {/* title row */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-display font-bold text-[22px] leading-tight tracking-tight flex-1">{m.title?.trim() || t('card.untitled')}</h1>
          </div>
          <p className="text-sea text-[13px] font-medium mt-1"><ArtistLinks mural={m} /></p>
        </div>

        {/* meta card */}
        <div className="bg-bg rounded-xl p-4 space-y-3">
          <div className="flex gap-3">
            <MapPin size={14} className="text-ink-3 mt-0.5 shrink-0" />
            <div>
              <p className="text-[9px] font-display font-bold uppercase tracking-wider text-ink-3 mb-1">{t('detail.location')}</p>
              <p className="text-[12px] text-ink-2 leading-relaxed">{m.location_description}</p>
              {(isLocationUnknown(m) || m.precision === 'lead') && <div className="mt-1.5"><LocationPill mural={m} /></div>}
            </div>
          </div>
          {m.precision && (
            <div className="flex gap-3">
              <Crosshair size={14} className="text-ink-3 mt-0.5 shrink-0" />
              <div>
                <p className="text-[9px] font-display font-bold uppercase tracking-wider text-ink-3 mb-1">{t('detail.precision')}</p>
                <p className="text-[12px] text-ink-2">{t(`prec.${m.precision}` as 'prec.lead')}</p>
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <Eye size={14} className="text-ink-3 mt-0.5 shrink-0" />
            <div>
              <p className="text-[9px] font-display font-bold uppercase tracking-wider text-ink-3 mb-1">{t('detail.communityStatus')}</p>
              <p className="text-[12px] text-ink-2">
                {totalVotes === 0
                  ? t('detail.noReports')
                  : t('detail.statusSummary', { a: m.still_here_count, b: m.removed_count, c: m.unsure_count })}
              </p>
            </div>
          </div>
        </div>

        {/* google maps link — disabled until a location is known */}
        {isLocationUnknown(m) ? (
          <div className="space-y-2">
            <div aria-disabled="true" className="flex items-center justify-between bg-groove text-ink-3 rounded-xl px-4 py-3 cursor-not-allowed">
              <div className="flex items-center gap-2 text-[13px] font-medium">
                <MapPin size={15} />
                {t('detail.openMaps')}
              </div>
              <span className="text-[11px] font-display font-semibold uppercase tracking-wide">{t('detail.noLocationYet')}</span>
            </div>
            <Link href={`/submit?mural=${encodeURIComponent(m.slug)}&title=${encodeURIComponent(m.title)}`}
              className="flex items-center justify-center gap-2 border border-sea text-sea rounded-xl px-4 py-3 text-[13px] font-display font-semibold">
              <Plus size={15} />
              {t('detail.addLocation')}
            </Link>
          </div>
        ) : (
          <a href={gmapsUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-between bg-sea-tint text-sea rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 text-[13px] font-medium">
              <MapPin size={15} />
              {t('detail.openMaps')}
            </div>
            <ExternalLink size={14} />
          </a>
        )}

        {m.notes && (
          <div>
            <p className="text-[10px] font-display font-bold uppercase tracking-wider text-ink-3 mb-2">{t('detail.notes')}</p>
            <p className="text-[12px] text-ink-2 leading-relaxed whitespace-pre-line">{m.notes}</p>
          </div>
        )}

        {/* status voting */}
        <div>
          <p className="text-[10px] font-display font-bold uppercase tracking-wider text-ink-3 mb-3">{t('detail.stillThere')}</p>
          <StatusVoting muralId={m.id} />
        </div>

        {/* comments */}
        <div>
          <p className="text-[10px] font-display font-bold uppercase tracking-wider text-ink-3 mb-4">
            {t(c.length === 1 ? 'detail.communityCount.one' : 'detail.communityCount.many', { n: c.length })}
          </p>
          <div className="space-y-4 mb-4">
            {c.length === 0 && (
              <p className="text-[13px] text-ink-3">{t('detail.noComments')}</p>
            )}
            {c.map(comment => (
              <div key={comment.id} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-groove flex items-center justify-center font-display font-bold text-[11px] text-ink-2 shrink-0 mt-0.5">
                  {(comment.author_name ?? 'A')[0].toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[12px] font-semibold text-ink">{comment.author_name ?? t('detail.anonymous')}</span>
                    <span className="text-[11px] text-ink-3">
                      {new Date(comment.created_at).toLocaleDateString(locale, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  {comment.body && <p className="text-[12px] text-ink-2 leading-relaxed">{comment.body}</p>}
                  {comment.status_vote && (
                    <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-display font-semibold px-2.5 py-0.5 rounded-full bg-certain-bg text-certain">
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
