/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF4F00', // Deep orange
          dark: '#CC3F00',
          light: '#FF7F40',
        },
        secondary: {
          DEFAULT: '#008080', // Teal
          dark: '#006666',
          light: '#00A3A3',
        },
        dark: {
          bg: '#1A1A1A',
          card: '#2D2D2D',
          hover: '#3D3D3D',
        },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: 'inherit',
            a: {
              color: '#FF4F00',
              '&:hover': {
                color: '#CC3F00',
              },
            },
            h1: {
              color: 'inherit',
              fontWeight: '700',
              fontSize: '2.25rem',
            },
            h2: {
              color: 'inherit',
              fontWeight: '600',
              fontSize: '1.875rem',
            },
            h3: {
              color: 'inherit',
              fontWeight: '600',
              fontSize: '1.5rem',
            },
            blockquote: {
              borderLeftColor: '#FF4F00',
              color: 'inherit',
              fontStyle: 'italic',
            },
            code: {
              color: '#FF4F00',
              backgroundColor: '#FFF5F2',
              borderRadius: '0.25rem',
              padding: '0.125rem 0.25rem',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            pre: {
              backgroundColor: '#1A1A1A',
              color: '#FFFFFF',
              borderRadius: '0.5rem',
            },
            strong: {
              color: 'inherit',
              fontWeight: '600',
            },
          },
        },
        dark: {
          css: {
            color: '#FFFFFF',
            a: {
              color: '#FF7F40',
              '&:hover': {
                color: '#FF9966',
              },
            },
            code: {
              backgroundColor: '#2D2D2D',
            },
            blockquote: {
              borderLeftColor: '#FF7F40',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
  ],
} 