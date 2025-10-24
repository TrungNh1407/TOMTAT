import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
    "!./node_modules/**/*",
    "!./dist/**/*",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: {
          400: 'var(--color-accent-400)',
          500: 'var(--color-accent-500)',
          600: 'var(--color-accent-600)',
          700: 'var(--color-accent-700)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        slab: ['Roboto Slab', 'serif'],
      },
    },
  },
  plugins: [
    typography,
  ],
}