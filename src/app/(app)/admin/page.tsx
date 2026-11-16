import Link from 'next/link'
import { Inbox, Images, MessageSquare, ChevronRight } from 'lucide-react'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { EnableAlerts } from '@/components/admin/EnableAlerts'

export default async function AdminHome() {
  const { supabase } = await requireAdmin()
  const [pending, murals, comments] = await Promise.all([
    supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('murals').select('id', { count: 'exact', head: true }),
    supabase.from('comments').select('id', { count: 'exact', head: true }),
  ])
  const cards = [
    { href: '/admin/submissions', label: 'Pending submissions', n: pending.count ?? 0, Icon: Inbox, hot: (pending.count ?? 0) > 0 },
    { href: '/admin/murals', label: 'Murals', n: murals.count ?? 0, Icon: Images, hot: false },
    { href: '/admin/comments', label: 'Comments', n: comments.count ?? 0, Icon: MessageSquare, hot: false },
  ]
  return (
    <div className="space-y-3">
      <EnableAlerts />
      {cards.map(({ href, label, n, Icon, hot }) => (
        <Link key={href} href={href} className="bg-surface rounded-sheet p-4 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${hot ? 'bg-likely-bg text-likely' : 'bg-sea-tint text-sea'}`}><Icon size={18} /></div>
          <div className="flex-1">
            <p className="font-display font-bold text-title leading-none">{n}</p>
            <p className="text-small text-ink-2 mt-1">{label}</p>
          </div>
          <ChevronRight size={16} className="text-ink-3" />
        </Link>
      ))}
      <Link href="/admin/murals/new" className="block text-center rounded-full bg-sea text-on-dark py-3 text-body font-display font-semibold">
        + Add a mural
      </Link>
    </div>
  )
}
