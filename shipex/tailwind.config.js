/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0B1120',
          soft: '#111A2E',
          raised: '#131D33',
        },
        panel: '#121B2E',
        beacon: {
          DEFAULT: '#FFA53D',
          soft: '#FFC170',
          dim: '#8A5A24',
        },
        transit: {
          DEFAULT: '#2DD4BF',
          soft: '#7EEBDD',
          dim: '#134E4A',
        },
        mist: {
          DEFAULT: '#E7ECF5',
          muted: '#8492A6',
          faint: '#4A5670',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'neu-out': '9px 9px 18px rgba(0,0,0,0.45), -7px -7px 16px rgba(255,255,255,0.03)',
        'neu-in': 'inset 6px 6px 12px rgba(0,0,0,0.45), inset -5px -5px 10px rgba(255,255,255,0.03)',
        'neu-sm': '5px 5px 10px rgba(0,0,0,0.4), -4px -4px 8px rgba(255,255,255,0.025)',
        'glow-beacon': '0 0 24px rgba(255,165,61,0.35)',
        'glow-transit': '0 0 24px rgba(45,212,191,0.35)',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        pulseRing: {
          '0%': { transform: 'scale(0.8)', opacity: '0.9' },
          '80%': { transform: 'scale(2.2)', opacity: '0' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        dashMove: {
          '0%': { strokeDashoffset: '24' },
          '100%': { strokeDashoffset: '0' },
        },
      },
      animation: {
        pulseRing: 'pulseRing 1.8s cubic-bezier(0.2,0.6,0.4,1) infinite',
        dashMove: 'dashMove 1s linear infinite',
      },
    },
  },
  plugins: [],
}
