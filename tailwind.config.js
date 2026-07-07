/** @type {import('tailwindcss').Config} */
export default {
     content: [
          "./index.html",
          "./src/**/*.{js,ts,jsx,tsx}",
     ],
     theme: {
          extend: {
               fontFamily: {
                    sans: ['Pretendard', 'sans-serif'],
               },
               colors: {
                    brand: {
                         DEFAULT: '#111827',
                         dark: '#0b1120',
                         light: '#f7f4ee',
                         accent: '#b8872f',
                         gold: '#c89b3c',
                         ink: '#15171c',
                    },
                    surface: {
                         DEFAULT: '#ffffff',
                         muted: '#f5f6f8',
                         border: '#e6e8ec',
                    },
               },
               boxShadow: {
                    soft: '0 14px 40px -28px rgba(15,23,42,0.28)',
                    'soft-lg': '0 22px 70px -34px rgba(15,23,42,0.34)',
               },
               borderRadius: {
                    card: '1rem',
               },
          },
     },
     plugins: [],
}
