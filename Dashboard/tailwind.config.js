/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff3ed",
          100: "#ffe3d4",
          500: "#f15a24",
          600: "#df4512",
          900: "#38190e"
        }
      }
    }
  },
  plugins: []
};