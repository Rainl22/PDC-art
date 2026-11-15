import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { MenuButton } from '@/components/layout/SideMenu'
import { AdminTabs } from '@/components/admin/AdminTabs'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()
  return (
    <div className="bg-bg min-h-dvh">
      <header className="bg-surface border-b border-groove sticky top-0 z-10 pt-safe">
        <div className="px-4 py-3 flex items-center gap-3">
          <MenuButton />
          <Link href="/admin" className="flex-1 font-display font-bold text-[17px] tracking-tight">Admin</Link>
          <Link href="/profile" className="text-[12px] text-ink-3 font-medium">Profile</Link>
        </div>
        <AdminTabs />
      </header>
      <div className="p-4 max-w-3xl mx-auto">{children}</div>
    </div>
  )
}
