/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta YakuAlert Qollana [cite: 1]
        primary: {
          DEFAULT: '#0B6E99',
          50: '#E6F3F8',
          100: '#CCE7F1',
          500: '#0B6E99',
          600: '#095C80',
          700: '#074A66'
        },
        sustainability: {
          DEFAULT: '#2E9E5B',
          50: '#E9F7EF',
          100: '#D2EFDF',
          500: '#2E9E5B',
          600: '#26854C'
        },
        warn: '#D97706',
        danger: '#DC2626'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
