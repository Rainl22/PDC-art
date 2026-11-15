import type { Mural } from '@/types/mural'
import { MapPinOff } from 'lucide-react'

export const isLocationUnconfirmed = (m: Pick<Mural, 'precision' | 'coordinates'>) =>
  !m.coordinates && (!m.precision || m.precision === 'lead')

export function LocationPill({ sm }: { sm?: boolean }) {
  const size = sm ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-display font-semibold tracking-wide uppercase bg-guessing-bg text-guessing ${size}`}>
      <MapPinOff size={sm ? 9 : 10} className="shrink-0" />
      Location unconfirmed
    </span>
  )
}
