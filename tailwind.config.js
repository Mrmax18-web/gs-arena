/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-base': '#03040a',
        'bg-surface': '#0a0a14',
        'bg-elevated': '#12131e',
        'glass-light': 'rgba(255, 255, 255, 0.05)',
        'glass-medium': 'rgba(255, 255, 255, 0.08)',
        'glass-strong': 'rgba(255, 255, 255, 0.12)',
        'glass-border': 'rgba(255, 255, 255, 0.10)',
        bgmi: {
          DEFAULT: '#FF6B35',
          primary: '#FF6B35',
          glow: '#FFD166',
          muted: 'rgba(255, 107, 53, 0.15)',
        },
        ff: {
          DEFAULT: '#FF2D2D',
          primary: '#FF2D2D',
          glow: '#FF7A00',
          muted: 'rgba(255, 45, 45, 0.15)',
        },
        accent: {
          cyan: '#00D9FF',
          green: '#10B981',
          amber: '#F59E0B',
          red: '#EF4444',
          purple: '#A855F7',
        },
        'text-primary': '#F1F5F9',
        'text-secondary': '#94A3B8',
        'text-muted': '#64748B',
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        display: ['Orbitron', 'sans-serif'],
        rajdhani: ['Rajdhani', 'sans-serif'],
        heading: ['Rajdhani', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        jetbrains: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
        'full': '9999px',
      },
      boxShadow: {
        'sm': '0 2px 8px rgba(0,0,0,0.4)',
        'md': '0 4px 16px rgba(0,0,0,0.5)',
        'lg': '0 8px 32px rgba(0,0,0,0.6)',
        'orange': '0 0 32px rgba(255,107,53,0.4)',
        'red': '0 0 32px rgba(255,45,45,0.4)',
        'cyan': '0 0 32px rgba(0,217,255,0.4)',
        'glow-bgmi': '0 0 32px rgba(255,107,53,0.4)',
        'glow-ff': '0 0 32px rgba(255,45,45,0.4)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'scan': 'scan-travel 4s linear infinite',
        'mesh-drift': 'mesh-drift 12s ease-in-out infinite alternate',
        'hex-orbit': 'hex-orbit 20s linear infinite',
        'border-sweep': 'border-sweep 3s ease infinite',
        'live-blink': 'live-blink 1.5s ease-in-out infinite',
        'corner-pulse': 'corner-pulse 2s ease-in-out infinite',
        'ember-rise': 'ember-rise 4s ease-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255,107,53,0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(255,107,53,0.5)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'scan-travel': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        },
        'mesh-drift': {
          '0%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(30px, -20px) scale(1.08)' },
          '100%': { transform: 'translate(-20px, 15px) scale(0.96)' },
        },
        'hex-orbit': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'border-sweep': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'live-blink': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(0.85)' },
        },
        'corner-pulse': {
          '0%, 100%': { borderColor: 'rgba(255, 255, 255, 0.2)' },
          '50%': { borderColor: '#00D9FF' },
        },
        'ember-rise': {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '1' },
          '100%': { transform: 'translateY(-120px) scale(0.3)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
