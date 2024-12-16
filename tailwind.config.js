const flowbite = require("flowbite-react/tailwind");

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    // Or if using `src` directory:
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/flowbite/**/*.js",
    flowbite.content(),
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Arial', 'sans-serif'],
        'gowun-batang': ['Gowun Batang', 'serif'],
        'nanum-gothic': ['Nanum Gothic', 'sans-serif'],
      },
      animation: {
        wiggle: 'wiggle 1s ease-in-out infinite',
      }
    },
    container: {
      center: true,
    },
  },
  plugins: [
    require('flowbite/plugin'),
    require('tailwind-scrollbar-hide'),
    flowbite.plugin(),
    function({ addUtilities }) {
      const newUtilities = {
        '.nanum-gothic': {
          fontFamily: '"Nanum Gothic", sans-serif',
          fontWeight: '400',
          fontStyle: 'normal',
        },
        '.nanum-gothic-bold': {
          fontFamily: '"Nanum Gothic", sans-serif',
          fontWeight: '700',
          fontStyle: 'normal',
        },
        '.nanum-gothic-extrabold': {
          fontFamily: '"Nanum Gothic", sans-serif',
          fontWeight: '800',
          fontStyle: 'normal',
        },
      }
      addUtilities(newUtilities)
    }
  ],
}
