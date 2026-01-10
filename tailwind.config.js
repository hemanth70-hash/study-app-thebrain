/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,ax}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#e0f2fe',
          warm: '#fff7ed',
          blue: '#2563eb'
        }
      }
    },
  },
  plugins: [],
}