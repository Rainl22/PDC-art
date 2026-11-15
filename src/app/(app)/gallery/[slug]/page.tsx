import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge'
import { StatusVoting } from '@/components/mural/StatusVoting'
import { CommentForm } from '@/components/mural/CommentForm'
import { PhotoGallery } from '@/components/mural/PhotoGallery'
import { getMuralGradient } from '@/lib/gradients'
import { ChevronLeft, MapPin, Crosshair, Eye, ExternalLink, Heart } from 'lucide-react'
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

const PRECISION_LABEL: Record<string, string> = {
  intersection: 'Intersection documented',
  landmark:     'Landmark — precise location',
  block:        'Block-level accuracy',
  area:         'Area — approximate',
  lead:         'Lead only — unconfirmed',
}

export default async function MuralDetailPage({ params }: Props) {
  const supabase = createClient()
  const { data: mural } = await supabase
    .from('murals').select('*').eq('slug', params.slug).single()

  if (!mural) notFound()

  const { data: comments } = await supabase
    .from('comments').select('*').eq('mural_id', mural.id)
    .order('created_at', { ascending: false }).limit(50)

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

      {/* content */}
      <div className="px-5 py-5 space-y-5">

        {/* title row */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-display font-bold text-[22px] leading-tight tracking-tight flex-1">{m.title}</h1>
            <button className="text-ink-3 hover:text-sea mt-1 shrink-0"><Heart size={20} /></button>
          </div>
          {m.artist && (
            <p className="text-sea text-[13px] font-medium mt-1">{m.artist}</p>
          )}
        </div>

        {/* meta card */}
        <div className="bg-bg rounded-xl p-4 space-y-3">
          <div className="flex gap-3">
            <MapPin size={14} className="text-ink-3 mt-0.5 shrink-0" />
            <div>
              <p className="text-[9px] font-display font-bold uppercase tracking-wider text-ink-3 mb-1">Location</p>
              <p className="text-[12px] text-ink-2 leading-relaxed">{m.location_description}</p>
            </div>
          </div>
          {m.precision && (
            <div className="flex gap-3">
              <Crosshair size={14} className="text-ink-3 mt-0.5 shrink-0" />
              <div>
                <p className="text-[9px] font-display font-bold uppercase tracking-wider text-ink-3 mb-1">Precision</p>
                <p className="text-[12px] text-ink-2">{PRECISION_LABEL[m.precision]}</p>
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <Eye size={14} className="text-ink-3 mt-0.5 shrink-0" />
            <div>
              <p className="text-[9px] font-display font-bold uppercase tracking-wider text-ink-3 mb-1">Community status</p>
              <p className="text-[12px] text-ink-2">
                {totalVotes === 0
                  ? 'No reports yet — be the first'
                  : `${m.still_here_count} still here · ${m.removed_count} removed · ${m.unsure_count} unsure`}
              </p>
            </div>
          </div>
        </div>

        {/* google maps link */}
        <a href={gmapsUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-between bg-sea-tint text-sea rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-[13px] font-medium">
            <MapPin size={15} />
            Open in Google Maps
          </div>
          <ExternalLink size={14} />
        </a>

        {/* status voting */}
        <div>
          <p className="text-[10px] font-display font-bold uppercase tracking-wider text-ink-3 mb-3">Is it still there?</p>
          <StatusVoting muralId={m.id} />
        </div>

        {/* comments */}
        <div>
          <p className="text-[10px] font-display font-bold uppercase tracking-wider text-ink-3 mb-4">
            Community · {c.length} report{c.length !== 1 ? 's' : ''}
          </p>
          <div className="space-y-4 mb-4">
            {c.length === 0 && (
              <p className="text-[13px] text-ink-3">No comments yet.</p>
            )}
            {c.map(comment => (
              <div key={comment.id} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-groove flex items-center justify-center font-display font-bold text-[11px] text-ink-2 shrink-0 mt-0.5">
                  {(comment.author_name ?? 'A')[0].toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[12px] font-semibold text-ink">{comment.author_name ?? 'Anonymous'}</span>
                    <span className="text-[11px] text-ink-3">
                      {new Date(comment.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  {comment.body && <p className="text-[12px] text-ink-2 leading-relaxed">{comment.body}</p>}
                  {comment.status_vote && (
                    <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-display font-semibold px-2.5 py-0.5 rounded-full bg-certain-bg text-certain">
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {comment.status_vote === 'still_here' ? 'Still here' : comment.status_vote === 'removed' ? 'Removed' : 'Unsure'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <CommentForm muralId={m.id} />
        </div>

      </div>
    </div>
  )
}
