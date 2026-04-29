/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E07B2B',
          50:  '#FEF3E7',
          100: '#FDDFC0',
          200: '#FBC185',
          300: '#F9A350',
          400: '#F08B35',
          500: '#E07B2B',
          600: '#C96820',
          700: '#A8541A',
          800: '#7B3D12',
          900: '#52280B',
        },
        dark: '#5C1F00',
        surface: '#F5F5F5',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 12px rgba(0,0,0,0.07)',
        modal: '0 8px 40px rgba(0,0,0,0.15)',
      },
    },
  },
  plugins: [],
}
