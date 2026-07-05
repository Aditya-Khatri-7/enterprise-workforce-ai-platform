/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        darkBg: '#0F1123', // Dark Slate-Blue
        darkSurface: '#151A30', // Darker Sapphire Card Surface for high contrast
        darkBorder: 'rgba(99, 102, 241, 0.2)', // Stronger glassy border
        darkText: '#F1F5F9', // Very high contrast off-white
        darkMuted: '#94A3B8',
        lightBg: '#FCEEF3', // Soft Pink tint for light mode gradient start
        lightSurface: '#FFFFFF',
        lightBorder: 'rgba(99, 102, 241, 0.15)',
        lightText: '#0B1023', // Deep Royal Blue text
        lightMuted: '#4B5563',
        royalBlue: '#0B1023',
        royalIndigo: '#1A1F3C',
        darkSapphire: '#16213E',
        midnightBlue: '#111827',
        royalPurple: '#1B2559',
        electricBlue: '#3B82F6',
        softCyan: '#22D3EE',
        glassWhite: 'rgba(255, 255, 255, 0.85)',
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          900: '#312e81',
        }
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        'glow-cyan': '0 0 15px rgba(34, 211, 238, 0.4)',
        'glow-indigo': '0 0 20px rgba(99, 102, 241, 0.3)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient-x': 'gradient-x 15s ease infinite',
        'shimmer': 'shimmer 2.5s infinite linear',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'gradient-x': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        }
      }
    },
  },
  plugins: [],
}

