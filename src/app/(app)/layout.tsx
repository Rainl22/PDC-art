import { BottomNav } from '@/components/layout/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="min-h-dvh pb-[calc(var(--nav-h)+1rem)]">{children}</div>
      <BottomNav />
    </>
  )
}
