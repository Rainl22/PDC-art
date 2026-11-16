'use client'
import { useState } from 'react'
import Link from 'next/link'
import { addVote, spamCode, submitMural } from '@/lib/murals'
import { useT } from '@/lib/i18n/client'
import { useAuth } from '@/lib/auth/useAuth'
import type { Key } from '@/lib/i18n/dict'
import type { StatusVote } from '@/types/mural'

const VOTES: { value: StatusVote; label: Key }[] = [
  { value: 'still_here', label: 'vote.stillHere' },
  { value: 'removed',    label: 'vote.removed'   },
]

/** Still here / Removed are quick votes. "Update" starts a submission for a new mural at the same spot. */
export function StatusVoting({ muralId, slug, title, unverified = false }: { muralId: string; slug: string; title: string; unverified?: boolean }) {
  const { t } = useT()
  const { isAdmin } = useAuth()
  const [voted, setVoted] = useState<StatusVote | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function vote(v: StatusVote) {
    if (voted || loading) return
    setLoading(true); setError(null)
    try {
      await addVote(muralId, v)
      setVoted(v)
      // On an unverified mural, "Still here" is also a verification request: it lands in the admin's Submissions to approve.
      if (v === 'still_here' && unverified && !isAdmin) {
        const marker = `Location verification for existing mural: ${slug}`
        submitMural({
          kind: 'location', mural_slug: slug, title, artist: null, location_description: marker, coordinates: null,
          location_source: null, notes: `${marker}\nSent from a "Still here" tap (no photo, no GPS).`, photo_paths: [],
        } as Parameters<typeof submitMural>[0]).catch(() => { /* the vote still counted */ })
      }
    } catch (e) {
      const code = spamCode(e)
      if (code === 'already_voted') setVoted(v)           // already counted today — just thank them
      else setError(t('submit.errGeneric'))
    } finally {
      setLoading(false)
    }
  }

  const btn = 'flex-1 py-2 rounded-panel text-small font-display font-semibold border text-center transition-colors'
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {voted ? (
          <p className="flex-1 text-small text-certain font-medium py-2">{t('vote.thanks')}</p>
        ) : VOTES.map(({ value, label }) => (
          <button key={value} onClick={() => vote(value)} disabled={loading}
            className={`${btn} border-groove text-ink-2 hover:border-sea hover:text-sea disabled:opacity-50`}>
            {t(label)}
          </button>
        ))}
        {isAdmin ? (
          <Link href={`/admin/murals/${muralId}`} className={`${btn} ${voted ? 'flex-none px-4' : ''} border-sea bg-sea text-on-dark`}>
            Edit
          </Link>
        ) : (
          <Link href={`/submit?mural=${encodeURIComponent(slug)}&title=${encodeURIComponent(title)}&mode=update`}
            className={`${btn} ${voted ? 'flex-none px-4' : ''} border-sea text-sea`}>
            {t('vote.update')}
          </Link>
        )}
      </div>
      {error && <p className="text-small text-guessing" role="alert">{error}</p>}
    </div>
  )
}
