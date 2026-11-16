import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { MenuButton } from '@/components/layout/SideMenu'
import { AdminTabs } from '@/components/admin/AdminTabs'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { supabase } = await requireAdmin()
  const { count } = await supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('status', 'pending')
  return (
    <div className="bg-bg min-h-dvh">
      <header className="bg-surface border-b border-groove sticky top-0 z-10 pt-controls">
        <div className="px-gutter h-control mb-3 flex items-center gap-3">
          <MenuButton />
          <Link href="/admin" className="flex-1 font-display font-bold text-[17px] tracking-tight">Admin</Link>
          <Link href="/profile" className="text-small text-ink-3 font-medium">Profile</Link>
        </div>
        <AdminTabs pending={count ?? 0} />
      </header>
      <div className="p-4 max-w-3xl mx-auto">{children}</div>
    </div>
  )
}
