/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sabia: {
          olive: '#8F7E4F',
          dark: '#34312D',
          silver: '#DCDCDD',
          maroon: '#70160A',
          frost: '#F2F2F7',
        }
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}