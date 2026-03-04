/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1E3A5F',
          light: '#2A4F7F',
          dark: '#152D4A',
        },
        brand: {
          DEFAULT: '#2E86AB',
          light: '#4A9EC0',
          dark: '#1F6A8A',
        },
        gold: {
          DEFAULT: '#C9A84C',
          light: '#D9BF72',
          dark: '#A88830',
        },
        surface: '#F8FAFC',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
