/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      colors: {
        income: '#10B981',
        expense: '#F43F5E',
        primary: { DEFAULT: '#6366F1', light: '#EEF2FF', dark: '#4F46E5' },
      },
    },
  },
  plugins: [],
};
