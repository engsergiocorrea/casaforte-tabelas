import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Casa Forte Brand Colors ──────────────────────
        cf: {
          red: '#E8390E',
          'red-dark': '#B8290A',
          'red-light': '#FDEEE9',
          'red-mid': '#F05A1A',
          charcoal: '#2A2A2A',
          dark: '#1E1E1E',
          gray: '#5A5A5A',
          'gray-light': '#F5F3F0',
          'gray-mid': '#E8E5E0',
          'gray-border': '#DDD9D3',
        },
        // ── Status colors ────────────────────────────────
        status: {
          disponivel: '#15803d',
          'disponivel-bg': '#f0fdf4',
          reservada: '#b45309',
          'reservada-bg': '#fffbeb',
          vendida: '#b91c1c',
          'vendida-bg': '#fef2f2',
          bloqueada: '#6b7280',
          'bloqueada-bg': '#f9fafb',
        },
      },
      fontFamily: {
        // Fonte para UI administrativa
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        // Fonte para tabelas e documentos
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      boxShadow: {
        'cf-sm': '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'cf-md': '0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.04)',
        'cf-lg': '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04)',
      },
      borderRadius: {
        'cf': '10px',
        'cf-lg': '14px',
        'cf-xl': '18px',
      },
    },
  },
  plugins: [],
}

export default config
