/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Propellex Sovereign Design System ──────────────────────────────
        // Background & Surface
        background:                '#131313',
        surface:                   '#131313',
        'surface-dim':             '#131313',
        'surface-bright':          '#393939',
        'surface-container-lowest':'#0e0e0e',
        'surface-container-low':   '#1c1b1b',
        'surface-container':       '#201f1f',
        'surface-container-high':  '#2a2a2a',
        'surface-container-highest':'#353534',
        'surface-variant':         '#353534',
        'inverse-surface':         '#e5e2e1',

        // On-Surface
        'on-surface':              '#e5e2e1',
        'on-surface-variant':      '#d0c5af',
        'on-background':           '#e5e2e1',
        'inverse-on-surface':      '#313030',

        // Primary — Champagne Gold
        primary:                   '#f2ca50',
        'primary-fixed':           '#ffe088',
        'primary-fixed-dim':       '#e9c349',
        'primary-container':       '#d4af37',
        'on-primary':              '#3c2f00',
        'on-primary-fixed':        '#241a00',
        'on-primary-fixed-variant':'#574500',
        'on-primary-container':    '#554300',
        'inverse-primary':         '#735c00',
        'surface-tint':            '#e9c349',

        // Secondary — Deep Emerald
        secondary:                 '#95d3ba',
        'secondary-fixed':         '#b0f0d6',
        'secondary-fixed-dim':     '#95d3ba',
        'secondary-container':     '#0b513d',
        'on-secondary':            '#003829',
        'on-secondary-fixed':      '#002117',
        'on-secondary-fixed-variant':'#0b513d',
        'on-secondary-container':  '#83c2a9',

        // Tertiary — Neutral
        tertiary:                  '#cecece',
        'tertiary-fixed':          '#e2e2e2',
        'tertiary-fixed-dim':      '#c6c6c7',
        'tertiary-container':      '#b2b3b3',
        'on-tertiary':             '#2f3131',
        'on-tertiary-fixed':       '#1a1c1c',
        'on-tertiary-fixed-variant':'#454747',
        'on-tertiary-container':   '#434546',

        // Outline
        outline:                   '#99907c',
        'outline-variant':         '#4d4635',

        // Error
        error:                     '#ffb4ab',
        'error-container':         '#93000a',
        'on-error':                '#690005',
        'on-error-container':      '#ffdad6',
      },
      fontFamily: {
        headline: ['"Noto Serif"', 'Georgia', 'serif'],
        body:     ['Manrope', 'system-ui', 'sans-serif'],
        label:    ['Manrope', 'system-ui', 'sans-serif'],
        sans:     ['Manrope', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0rem',
        none:    '0rem',
        sm:      '0rem',
        md:      '0rem',
        lg:      '0rem',
        xl:      '0rem',
        '2xl':   '0rem',
        full:    '9999px',
      },
      keyframes: {
        marquee: {
          '0%':   { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        marquee:  'marquee 30s linear infinite',
        'fade-in':'fade-in 0.4s ease-out forwards',
      },
    },
  },
  plugins: [],
};
