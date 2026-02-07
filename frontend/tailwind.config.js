/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#663399',
          light: '#8855BB',
          dark: '#572B82',
          50: '#F8F5FC',
          100: '#F0E8F7',
          200: '#E0D1F0',
        },
        accent: {
          DEFAULT: '#017E84',
          light: '#02999F',
          dark: '#016366',
        },
        blue: {
          50: '#F8F5FC',
          100: '#F0E8F7',
          200: '#E0D1F0',
          300: '#C9ADE4',
          400: '#A87FD4',
          500: '#8855BB',
          600: '#663399',
          700: '#572B82',
          800: '#48236B',
          900: '#3A1C57',
          950: '#240F39',
        },
      },
    },
  },
  plugins: [],
};
