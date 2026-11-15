'use client'
import { useState } from 'react'
import { addVote, spamCode } from '@/lib/murals'
import { useT } from '@/lib/i18n/client'
import type { Key } from '@/lib/i18n/dict'
import type { StatusVote } from '@/types/mural'

const VOTES: { value: StatusVote; label: Key }[] = [
  { value: 'still_here', label: 'vote.stillHere' },
  { value: 'removed',    label: 'vote.removed'   },
  { value: 'unsure',     label: 'vote.unsure'    },
]

export function StatusVoting({ muralId }: { muralId: string }) {
  const { t } = useT()
  const [voted, setVoted] = useState<StatusVote | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function vote(v: StatusVote) {
    if (voted || loading) return
    setLoading(true); setError(null)
    try {
      await addVote(muralId, v)
      setVoted(v)
    } catch (e) {
      const code = spamCode(e)
      if (code === 'already_voted') setVoted(v)           // already counted today — just thank them
      else setError(t('submit.errGeneric'))
    } finally {
      setLoading(false)
    }
  }

  if (voted) {
    return <p className="text-[12px] text-certain font-medium py-2">{t('vote.thanks')}</p>
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {VOTES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => vote(value)}
            disabled={loading}
            className="flex-1 py-2 rounded-md text-[12px] font-display font-semibold border border-groove text-ink-2 hover:border-sea hover:text-sea transition-colors disabled:opacity-50"
          >
            {t(label)}
          </button>
        ))}
      </div>
      {error && <p className="text-[12px] text-guessing" role="alert">{error}</p>}
    </div>
  )
}
