import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg:         '#F3F1EC',
        surface:    '#FFFFFF',
        groove:     '#E5E2DA',
        ink:        '#18171A',
        'ink-2':    '#68636A',
        'ink-3':    '#A09CA4',
        sea:        '#326A82',
        'sea-tint': '#E8F2F6',
        'sea-dark': '#245970',
        certain:    { DEFAULT: '#0A7560', bg: '#E4F3EF' },
        likely:     { DEFAULT: '#A86C10', bg: '#FBF0DC' },
        guessing:   { DEFAULT: '#9E2222', bg: '#F9E5E5' },
        removed:    { DEFAULT: '#6038A0', bg: '#EEE6F7' },
      },
      fontFamily: {
        display: ['Syne', 'system-ui', 'sans-serif'],
        body:    ['DM Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm:   '8px',
        md:   '16px',
        lg:   '24px',
        xl:   '32px',
        full: '9999px',
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
