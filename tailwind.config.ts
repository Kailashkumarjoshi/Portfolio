import type { Config } from 'tailwindcss';

/**
 * Romantic luxury palette.
 * Warm plum/burgundy grounds, blush + ivory paper, champagne + rose-gold accents.
 * Deliberately desaturated: no neon pink, no pure red, no electric purple.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deep romantic darks (backgrounds)
        midnight: {
          DEFAULT: '#140a12',
          900: '#0d0609',
          800: '#140a12',
          700: '#1d0f18',
          600: '#281420',
        },
        plum: {
          900: '#26121f',
          800: '#331a29',
          700: '#432235',
          600: '#552c44',
          500: '#6b3a56',
        },
        wine: {
          900: '#3a0f1d',
          800: '#4d1628',
          700: '#631e34',
          600: '#7c2743',
          500: '#963554',
        },
        // Soft romantic mids
        mauve: {
          400: '#a97f97',
          300: '#bd9aae',
          200: '#d2b6c5',
          100: '#e6d5df',
        },
        rose: {
          600: '#b0697d',
          500: '#c4818f',
          400: '#d49aa4',
          300: '#e3b7bd',
          200: '#f0d2d4',
          100: '#f8e7e7',
        },
        blush: '#f5e2e0',
        peach: '#f4cdb4',
        lavender: '#cfc2de',
        // Warm neutrals (paper / cards)
        ivory: '#fbf5ee',
        cream: '#f3e9dd',
        beige: '#e8d9c6',
        // Metallics
        champagne: {
          DEFAULT: '#e3c9a0',
          light: '#f0e0c4',
          deep: '#c8a877',
        },
        rosegold: '#d9a38f',
        ink: '#2a1b22',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        serif: ['var(--font-body-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        script: ['var(--font-script)', 'cursive'],
      },
      borderRadius: {
        card: '1.25rem',
      },
      boxShadow: {
        keepsake:
          '0 1px 1px rgba(20,10,18,.28), 0 12px 28px -12px rgba(20,10,18,.55), 0 30px 60px -30px rgba(58,15,29,.5)',
        'keepsake-lift':
          '0 2px 2px rgba(20,10,18,.3), 0 22px 48px -14px rgba(20,10,18,.6), 0 50px 90px -40px rgba(124,39,67,.55)',
        candle: '0 0 60px -10px rgba(227,201,160,.35)',
        inset: 'inset 0 1px 0 rgba(255,255,255,.35)',
      },
      transitionTimingFunction: {
        silk: 'cubic-bezier(.22,.61,.36,1)',
        drape: 'cubic-bezier(.33,.02,.18,1)',
      },
      keyframes: {
        drift: {
          '0%,100%': { transform: 'translate3d(0,0,0)' },
          '50%': { transform: 'translate3d(0,-14px,0)' },
        },
        flicker: {
          '0%,100%': { opacity: '.82' },
          '45%': { opacity: '1' },
          '70%': { opacity: '.88' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-120% 0' },
          '100%': { backgroundPosition: '220% 0' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translate3d(0,18px,0)' },
          to: { opacity: '1', transform: 'none' },
        },
      },
      animation: {
        drift: 'drift 11s ease-in-out infinite',
        flicker: 'flicker 6s ease-in-out infinite',
        shimmer: 'shimmer 3.5s linear infinite',
        fadeUp: 'fadeUp .7s cubic-bezier(.22,.61,.36,1) both',
      },
    },
  },
  plugins: [],
};

export default config;
