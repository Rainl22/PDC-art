'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addComment, spamCode } from '@/lib/murals'
import { useT } from '@/lib/i18n/client'
import { Send } from 'lucide-react'

export function CommentForm({ muralId }: { muralId: string }) {
  const router = useRouter()
  const { t } = useT()
  const [text, setText]     = useState('')
  const [name, setName]     = useState('')
  const [loading, setLoading] = useState(false)
  const [trap, setTrap]     = useState('')   // honeypot: real people never see or fill this
  const [error, setError]   = useState<string | null>(null)

  async function submit() {
    if (!text.trim() || loading) return
    if (trap) { setText(''); return }          // bot: pretend it worked
    setLoading(true); setError(null)
    try {
      await addComment(muralId, text.trim(), name.trim() || null)
      setText('')
      router.refresh()
    } catch (e) {
      const code = spamCode(e)
      setError(code === 'rate_limited' ? t('spam.rate') : code === 'too_many_links' ? t('spam.links') : code === 'too_long' ? t('spam.long') : t('submit.errGeneric'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <input type="text" name="website" value={trap} onChange={e => setTrap(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true"
        className="absolute left-[-9999px] w-px h-px opacity-0" />
      <input
        type="text"
        maxLength={60}
        placeholder={t('comment.name')}
        value={name}
        onChange={e => setName(e.target.value)}
        className="w-full text-[13px] bg-bg rounded-md px-3 py-2 outline-none border border-transparent focus:border-sea placeholder:text-ink-3"
      />
      <div className="flex items-center gap-2 bg-bg rounded-full pl-4 pr-1.5 py-1.5">
        <input
          type="text"
          maxLength={1000}
          placeholder={t('comment.add')}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          className="flex-1 text-[13px] bg-transparent outline-none placeholder:text-ink-3"
        />
        <button
          onClick={submit}
          disabled={!text.trim() || loading}
          className="w-8 h-8 rounded-full bg-sea flex items-center justify-center text-white disabled:opacity-40 shrink-0"
        >
          <Send size={13} />
        </button>
      </div>
      {error && <p className="text-[12px] text-guessing" role="alert">{error}</p>}
    </div>
  )
}
