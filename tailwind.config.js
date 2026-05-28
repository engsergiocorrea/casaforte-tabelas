/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cf: {
          red: '#E8390E',
          'red-dark': '#B8290A',
          'red-light': '#FDEEE9',
          charcoal: '#2A2A2A',
          gray: '#5A5A5A',
          'gray-light': '#F5F3F0',
          'gray-mid': '#E8E5E0',
          'gray-border': '#DDD9D3',
        },
      },
    },
  },
  plugins: [],
}
