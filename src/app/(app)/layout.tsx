import { BottomNav } from '@/components/layout/BottomNav'
import { MenuProvider } from '@/components/layout/SideMenu'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <MenuProvider>
      <div className="min-h-dvh pb-[calc(var(--nav-h)+1rem)]">{children}</div>
      <BottomNav />
    </MenuProvider>
  )
}
