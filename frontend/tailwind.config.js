/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#00B843',
          greenHover: '#009E39',
          mint: '#E8F7EE',
          mintBorder: '#BCE8CC',
          amberBg: '#FFF4E5',
          amberText: '#D97706',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};