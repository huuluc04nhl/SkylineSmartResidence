/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        hendon: {
          gold: '#C5A880',
          'gold-dark': '#9E8057',
          'gold-light': '#F4EFEA',
          noir: '#0D1117',
          charcoal: '#161B22',
          slate: '#21262D',
          border: '#30363D',
          'light-bg': '#F6F8FA',
          'light-card': '#FFFFFF',
          'light-border': '#D0D7DE',
          muted: '#8B949E',
          crimson: '#E5534B',
          emerald: '#3FB950',
          amber: '#D29922',
        },
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Playfair Display', 'Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        none: '0px',
        sm: '2px',
        DEFAULT: '3px',
        md: '4px',
        lg: '6px',
      },
      letterSpacing: {
        architectural: '0.2em',
        widest: '0.15em',
      },
    },
  },
  plugins: [],
}
