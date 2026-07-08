/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      },
      colors: {
        primary: {
          50: '#f3faf6',
          100: '#e3f5eb',
          200: '#cbebd9',
          300: '#a3dbae',
          400: '#72c48d',
          500: '#10a359',
          600: '#0a8547',
          700: '#086937',
          800: '#064e29',
          900: '#04361c',
          950: '#021f10',
        },
      },
    },
  },
  plugins: [],
};
