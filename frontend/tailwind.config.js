import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    path.join(__dirname, 'index.html'),
    path.join(__dirname, 'src/**/*.{js,ts,jsx,tsx}'),
    // Also include relative paths in case Vite resolves from root
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../frontend/index.html",
    "../frontend/src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        space: {
          950: '#03040B',
          900: '#050611',
          800: '#0A1024',
          700: '#0E1736',
          600: '#16234D',
          500: '#1E2F65',
        },
        cosmic: {
          blue: '#2563EB',
          cyan: '#22D3EE',
          violet: '#8B5CF6',
          purple: '#A855F7',
          magenta: '#D946EF',
        },
        ui: {
          surface: '#0B1124',
          card: '#0F172E',
          glass: 'rgba(15, 23, 46, 0.65)',
          border: 'rgba(139, 92, 246, 0.18)',
          borderCyan: 'rgba(34, 211, 238, 0.22)',
          textPrimary: '#F8FAFC',
          textSecondary: '#A7B1C5',
          textMuted: '#64748B',
        }
      },
      fontFamily: {
        heading: ['"Space Grotesk"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'cosmic-gradient': 'linear-gradient(135deg, #050611 0%, #0A1024 50%, #0E1736 100%)',
        'orb-glow': 'radial-gradient(circle, rgba(139,92,246,0.25) 0%, rgba(34,211,238,0.15) 50%, transparent 80%)',
        'card-gradient': 'linear-gradient(180deg, rgba(20, 29, 58, 0.5) 0%, rgba(10, 16, 36, 0.8) 100%)',
      },
      boxShadow: {
        'neon-cyan': '0 0 25px rgba(34, 211, 238, 0.35)',
        'neon-violet': '0 0 25px rgba(139, 92, 246, 0.35)',
        'cosmic-card': '0 8px 32px 0 rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'orbit-spin': 'spin 20s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
