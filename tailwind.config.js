/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f1f5ef',
          100: '#e3ebdf',
          500: '#557b57',
          600: '#416744',
          700: '#315337',
          800: '#243f2a',
          900: '#192f20',
        },
        cream: '#f7f8f5',
      },
      boxShadow: {
        soft: '0 8px 30px rgba(31, 55, 35, 0.07)',
      },
    },
  },
  plugins: [],
}