/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#090305',
        surface: {
          DEFAULT: 'rgba(28, 8, 16, 0.68)',
          light: 'rgba(42, 12, 24, 0.75)',
          lighter: 'rgba(60, 16, 32, 0.82)'
        },
        // Rich Crimson, Ruby & Rose Brand Palette
        brand: {
          50: '#FFF1F2',
          100: '#FFE4E6',
          200: '#FECDD3',
          300: '#FDA4AF',
          400: '#FB7185',
          500: '#F43F5E',
          600: '#E11D48',
          700: '#BE123C',
          800: '#9F1239',
          900: '#881337',
          950: '#4C0519'
        },
        // Translucent Obsidian Wine Neutral Palette (replaces cold dull slate)
        slate: {
          50: '#FFF5F6',
          100: '#FFE8EB',
          200: '#FED2D8',
          300: '#FCA5B1',
          400: '#E598A4',
          500: '#B86A7B',
          600: '#6E3245',
          700: '#451B29',
          800: '#2A0E19',
          900: '#1A070F',
          950: '#0F0308'
        },
        // Vibrant Wine & Deep Carmine (replaces cold indigo)
        indigo: {
          50: '#FFF1F2',
          100: '#FFE4E6',
          200: '#FECDD3',
          300: '#FDA4AF',
          400: '#FB7185',
          500: '#F43F5E',
          600: '#BE123C',
          700: '#9F1239',
          800: '#881337',
          900: '#4C0519',
          950: '#2B030E'
        },
        accent: {
          cyan: '#FF4D6D', // Glowing Electric Coral/Rose
          emerald: '#10B981',
          amber: '#F59E0B',
          rose: '#F43F5E',
          ruby: '#FF2A55',
          crimson: '#E11D48',
          violet: '#C026D3'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Outfit"', 'sans-serif']
      },
      boxShadow: {
        glow: '0 0 28px -4px rgba(244, 63, 94, 0.4)',
        'glow-rose': '0 0 35px -5px rgba(225, 29, 72, 0.5)',
        'glow-crimson': '0 0 40px -6px rgba(255, 42, 85, 0.6)',
        'glow-cyan': '0 0 28px -4px rgba(255, 77, 109, 0.4)',
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.25)'
      }
    },
  },
  plugins: [],
}
