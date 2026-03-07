/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50:  '#f2f7f2',
          100: '#dfeee0',
          200: '#c0dcc2',
          300: '#93c297',
          400: '#60a166',
          500: '#3d8344',
          600: '#2d6733',
          700: '#24532a',
          800: '#1B2E1F',
          900: '#162618',
          950: '#0a1309',
        },
        gold: {
          50:  '#fdf9ee',
          100: '#faf0d0',
          200: '#f4de9d',
          300: '#edc764',
          400: '#C9A84C',
          500: '#b8922e',
          600: '#9d7324',
          700: '#7e5620',
          800: '#684521',
          900: '#583a20',
        },
        cream: {
          50:  '#FAFAF7',
          100: '#F5F0E8',
          200: '#EDE5D4',
          300: '#E0D5BE',
          400: '#C9BFAA',
        },
        bark: {
          400: '#8B7355',
          500: '#7A6348',
          600: '#6B5440',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Lora', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'ridge-texture': "url('/textures/subtle-grain.png')",
      },
    },
  },
  plugins: [],
};
