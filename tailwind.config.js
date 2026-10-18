/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Agency FB"', 'Teko', 'Oswald', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#DC2626',
          hover: '#B91C1C',
          light: 'rgba(220, 38, 38, 0.1)',
        },
        brand: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#DC2626',
          600: '#B91C1C',
          700: '#991B1B',
          800: '#7F1D1D',
          900: '#450A0A',
          accent: '#DC2626',
        },
      },
      backdropBlur: {
        '3xl': '64px',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-sm': '0 4px 16px 0 rgba(0, 0, 0, 0.25)',
        'glass-glow': '0 0 25px -5px rgba(220, 38, 38, 0.3)',
      },
    },
  },
  plugins: [],
};
