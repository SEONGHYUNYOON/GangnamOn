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
                         DEFAULT: '#7c3aed',
                         dark: '#6d28d9',
                         light: '#f5f3ff',
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
