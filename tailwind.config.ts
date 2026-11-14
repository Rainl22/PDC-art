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
      },
    },
    // safe area insets for notched phones
    padding: {
      'safe':       'env(safe-area-inset-bottom, 0px)',
      'safe-or-4':  'max(env(safe-area-inset-bottom, 0px), 1rem)',
      'safe-or-12': 'max(env(safe-area-inset-top, 0px), 3rem)',
    },
    inset: {
      'safe-or-12': 'max(env(safe-area-inset-top, 0px), 3rem)',
    },
  },
  plugins: [],
}

export default config
