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
        certain:  { DEFAULT: 'var(--certain)',  bg: 'var(--certain-bg)' },
        likely:   { DEFAULT: 'var(--likely)',   bg: 'var(--likely-bg)' },
        guessing: { DEFAULT: 'var(--guessing)', bg: 'var(--guessing-bg)', line: 'var(--guessing-line)' },
        removed:  { DEFAULT: 'var(--removed)',  bg: 'var(--removed-bg)' },
      },
      fontFamily: {
        display: ['Syne', 'system-ui', 'sans-serif'],
        body:    ['DM Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        full:  '9999px',
        inset: 'var(--r-inset)',
        panel: 'var(--r-panel)',
        card:  'var(--r-card)',
        sheet: 'var(--r-sheet)',
      },
      fontSize: {
        'tag-sm': ['var(--fs-tag-sm)', { lineHeight: '1.25' }],
        tag:      ['var(--fs-tag)',    { lineHeight: '1.25' }],
        caption:  ['var(--fs-caption)', { lineHeight: '1.35' }],
        small:    ['var(--fs-small)',   { lineHeight: '1.45' }],
        body:     ['var(--fs-body)',    { lineHeight: '1.5' }],
        card:     ['var(--fs-card)',    { lineHeight: '1.25' }],
        title:    ['var(--fs-title)',   { lineHeight: '1.2' }],
      },
      spacing: {
        gutter:          'var(--space-gutter)',
        grid:            'var(--space-grid)',
        'card-inset':    'var(--space-card-inset)',
        'card-inset-x':  'var(--space-card-inset-x)',
        'sheet-overlap': 'var(--space-sheet-overlap)',
        control:         'var(--control-h)',
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
