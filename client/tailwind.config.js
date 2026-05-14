/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'obsidian': '#0A0A0A',
        'surface':  '#141414',
        'cobalt':   '#2E5BFF',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      fontSize: {
        '5xl': ['3rem', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '900' }],
      },
      spacing: {
        '18': '4.5rem',
      },
    },
  },
  plugins: [],
}
