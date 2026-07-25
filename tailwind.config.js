/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'Georgia', 'serif'],
      },
      colors: {
        brand: 'var(--text-brand)',
        app: 'var(--bg-app)',
        surface: 'var(--bg-surface)',
        card: 'var(--bg-card)',
        'card-hover': 'var(--bg-card-hover)',
        main: 'var(--text-main)',
        muted: 'var(--text-muted)',
        inverse: 'var(--text-inverse)',
        primary: 'var(--color-primary)',
        'primary-hover': 'var(--color-primary-hover)',
        accent: 'var(--color-accent)',
        danger: 'var(--color-danger)',
        border: 'var(--border-main)',
        'border-input': 'var(--border-input)',
        'cat-food': 'var(--cat-food)',
        'cat-shelter': 'var(--cat-shelter)',
        'cat-health': 'var(--cat-health)',
        'cat-legal': 'var(--cat-legal)',
        'cat-support': 'var(--cat-support)',
        nav: 'var(--bg-nav)',
        'nav-hover': 'var(--bg-nav-hover)',
        'on-nav': 'var(--text-on-nav)',
        'on-nav-muted': 'var(--text-on-nav-muted)',
      },
    },
  },
  plugins: [],
}
