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
                         DEFAULT: '#1e293b',
                         dark: '#0f172a',
                         light: '#f8fafc',
                         accent: '#d97706',
                         gold: '#c9a962',
                    },
                    surface: {
                         DEFAULT: '#ffffff',
                         muted: '#f4f5f7',
                         border: '#e8eaed',
                    },
               },
               boxShadow: {
                    soft: '0 8px 30px -10px rgba(0,0,0,0.08)',
                    'soft-lg': '0 16px 48px -12px rgba(0,0,0,0.12)',
               },
               borderRadius: {
                    card: '1.5rem',
               },
          },
     },
     plugins: [],
}
