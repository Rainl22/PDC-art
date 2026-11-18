import { BottomNav } from '@/components/layout/BottomNav'
import { TourTray } from '@/components/layout/TourTray'
import { TopBar } from '@/components/layout/TopBar'
import { MenuProvider } from '@/components/layout/SideMenu'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <MenuProvider>
      <TopBar />
      <div className="min-h-[calc(100dvh-var(--topbar-h))] pb-[calc(var(--nav-h)+1rem)]">{children}</div>
      <TourTray />
      <BottomNav />
    </MenuProvider>
  )
}
