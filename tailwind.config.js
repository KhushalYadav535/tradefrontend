/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#000000',
        surface: '#111318',
        surface2: '#181b22',
        border: '#23262e',
        accent: '#22c55e',
        red: '#ef4444',
        brand: '#7c3aed',
        'brand-2': '#a855f7',
        muted: '#7a8294',
        bidBg: '#5e1a23',
        askBg: '#1d3b73',
      },
      fontFamily: {
        heading: ['Rajdhani', 'system-ui', 'sans-serif'],
        body: ['Exo 2', 'system-ui', 'sans-serif'],
        mono: ['Share Tech Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(124,58,237,0.25), 0 8px 30px rgba(124,58,237,0.12)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
