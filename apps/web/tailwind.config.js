/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /* ── Design Tokens FleetCore (Soft Corporate Dark Theme) ── */
        background: '#1E293B', /* Slate 800 - Dos tonos más claro */
        surface: '#334155',    /* Slate 700 */

        /* Sidebar y elementos estructurales */
        sidebar: {
          bg: '#0F172A',       /* Slate 900 - Para dar contraste al fondo claro */
          border: '#334155',
          active: '#FFB81C',
          'active-text': '#0F172A',
          text: '#CBD5E1',
          hover: '#1E293B',
        },

        /* Colores primarios — Amarillo Caterpillar */
        primary: {
          DEFAULT: '#FFB81C',
          light: '#FFD100',
          50:  '#42320E',
          100: '#5E4410',
          200: '#8A6213',
          500: '#D97706',
          600: '#B45309',
          700: '#92400E',
          900: '#78350F',
        },

        /* Colores de estado (Adaptados para Soft Dark) */
        success: {
          DEFAULT: '#10B981',
          bg: 'rgba(16, 185, 129, 0.2)',
          text: '#6EE7B7',
        },
        warning: {
          DEFAULT: '#F59E0B',
          bg: 'rgba(245, 158, 11, 0.2)',
          text: '#FCD34D',
        },
        danger: {
          DEFAULT: '#EF4444',
          bg: 'rgba(239, 68, 68, 0.2)',
          text: '#FCA5A5',
        },
        info: {
          DEFAULT: '#3B82F6',
          bg: 'rgba(59, 130, 246, 0.2)',
          text: '#93C5FD',
        },

        /* Texto */
        text: {
          primary: '#F8FAFC',   /* Slate 50 */
          secondary: '#E2E8F0', /* Slate 200 */
          muted: '#94A3B8',     /* Slate 400 */
          inverse: '#0F172A',
        },

        /* Bordes */
        border: {
          DEFAULT: '#475569',   /* Slate 600 */
          strong: '#64748B',    /* Slate 500 */
        },
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },

      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.05)',
        'card-md': '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)',
        'card-lg': '0 10px 15px -3px rgba(0,0,0,0.07), 0 4px 6px -4px rgba(0,0,0,0.05)',
      },

      borderRadius: {
        card: '0.75rem',
      },
    },
  },
  plugins: [],
}
