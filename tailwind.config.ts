import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      // colours live in src/styles/tokens.css (single source)
      colors: {
        bg: 'var(--bg)', surface: 'var(--surface)', groove: 'var(--groove)', 'groove-soft': 'var(--groove-soft)',
        ink: 'var(--ink)', 'ink-2': 'var(--ink-2)', 'ink-3': 'var(--ink-3)',
        sea: 'var(--sea)', 'sea-tint': 'var(--sea-tint)', 'sea-dark': 'var(--sea-dark)',
        'on-dark': 'var(--on-dark)', backdrop: 'var(--backdrop)', you: 'var(--you)',
        glass: 'var(--glass)', 'glass-dim': 'var(--glass-dim)', 'glass-faint': 'var(--glass-faint)', scrim: 'var(--scrim)',
        marigold: { DEFAULT: 'var(--marigold)', tint: 'var(--marigold-tint)' },
        like: 'var(--like)',
        certain:     { DEFAULT: 'var(--certain)',     bg: 'var(--certain-bg)' },
        unconfirmed: { DEFAULT: 'var(--unconfirmed)', bg: 'var(--unconfirmed-bg)' },
        danger:      { DEFAULT: 'var(--danger)',      bg: 'var(--danger-bg)', line: 'var(--danger-line)' },
        removed:  { DEFAULT: 'var(--removed)',  bg: 'var(--removed-bg)' },
      },
      fontFamily: {
        display: ['var(--font-syne)', 'Syne', 'system-ui', 'sans-serif'],
        body:    ['var(--font-dm-sans)', 'DM Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        full:  '9999px',
        inset: 'var(--r-inset)',
        panel: 'var(--r-panel)',
        card:  'var(--r-card)',
        sheet: 'var(--r-sheet)',
      },
      fontSize: {
        12: ['var(--fs-12)', { lineHeight: '1.35' }],
        13: ['var(--fs-13)', { lineHeight: '1.4' }],
        14: ['var(--fs-14)', { lineHeight: '1.5' }],
        16: ['var(--fs-16)', { lineHeight: '1.4' }],
        20: ['var(--fs-20)', { lineHeight: '1.15' }],
        28: ['var(--fs-28)', { lineHeight: '1.05' }],
        40: ['var(--fs-40)', { lineHeight: '1' }],
      },
      boxShadow: {
        1: 'var(--shadow-1)',
        2: 'var(--shadow-2)',
      },
      spacing: {
        gutter:          'var(--space-gutter)',
        grid:            'var(--space-grid)',
        row:             'var(--space-row)',
        'card-inset':    'var(--space-card-inset)',
        'card-inset-x':  'var(--space-card-inset-x)',
        'sheet-overlap': 'var(--space-sheet-overlap)',
        control:         'var(--control-h)',
        field:           'var(--field-h)',
        'gap-control':   'var(--gap-control)',
        controls:        'var(--inset-top-controls)',
      },
      padding: {
        'safe':       'env(safe-area-inset-bottom, 0px)',
        'safe-or-4':  'max(env(safe-area-inset-bottom, 0px), 1rem)',
        'safe-or-12': 'max(env(safe-area-inset-top, 0px), 3rem)',
      },
      inset: {
        'safe-or-12': 'max(env(safe-area-inset-top, 0px), 3rem)',
      },
    },
  },
  plugins: [],
}

export default config
