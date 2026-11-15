'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addComment } from '@/lib/murals'
import { useT } from '@/lib/i18n/client'
import { Send } from 'lucide-react'

export function CommentForm({ muralId }: { muralId: string }) {
  const router = useRouter()
  const { t } = useT()
  const [text, setText]     = useState('')
  const [name, setName]     = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!text.trim() || loading) return
    setLoading(true)
    try {
      await addComment(muralId, text.trim(), name.trim() || null, null)
      setText('')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <input
        type="text"
        placeholder={t('comment.name')}
        value={name}
        onChange={e => setName(e.target.value)}
        className="w-full text-[13px] bg-bg rounded-md px-3 py-2 outline-none border border-transparent focus:border-sea placeholder:text-ink-3"
      />
      <div className="flex items-center gap-2 bg-bg rounded-full pl-4 pr-1.5 py-1.5">
        <input
          type="text"
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
    </div>
  )
}
