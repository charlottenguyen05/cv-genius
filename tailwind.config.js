/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f0faf0',
          100: '#dcf5dc',
          200: '#b8ebb8',
          300: '#86da86',
          400: '#6DC24B',
          500: '#4CAF50',
          600: '#3d9140',
          700: '#2e7032',
          800: '#1E4D2B',
          900: '#143320',
        },
        dark: {
          DEFAULT: '#111111',
          card:    '#1E4D2B',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          tint:    '#F5F9F0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-10px)' },
        },
        'float-delayed': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-8px)' },
        },
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          '0%':   { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-right': {
          '0%':   { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        float:              'float 4s ease-in-out infinite',
        'float-delayed':    'float-delayed 5s ease-in-out infinite 1s',
        'float-slow':       'float 6s ease-in-out infinite 0.5s',
        'fade-up':          'fade-up 0.6s ease-out forwards',
        'slide-in-left':    'slide-in-left 0.6s ease-out forwards',
        'slide-in-right':   'slide-in-right 0.6s ease-out forwards',
      },
    },
  },
  plugins: [],
}