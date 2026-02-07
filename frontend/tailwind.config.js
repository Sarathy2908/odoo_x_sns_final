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
          DEFAULT: '#1E40AF',
          light: '#3B82F6',
          dark: '#1E3A8A',
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
        },
        accent: {
          DEFAULT: '#017E84',
          light: '#02999F',
          dark: '#016366',
        },
      },
    },
  },
  plugins: [],
};
