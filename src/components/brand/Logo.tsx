/** App mark: cream "M" on sea-blue. Matches public/icon-*.png. */
export function Logo({ size = 36, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" className={className}>
      <rect width="100" height="100" rx="22" fill="#326A82" />
      <polyline points="28,70 28,30 50,55 72,30 72,70" fill="none" stroke="#F3F1EC" strokeWidth="9"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
