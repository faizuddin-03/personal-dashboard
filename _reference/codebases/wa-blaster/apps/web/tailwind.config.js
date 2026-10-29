/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg)',
        'background-subtle': 'var(--bg-subtle)',
        'background-sunken': 'var(--bg-sunken)',
        'background-hover': 'var(--bg-hover)',
        'background-selected': 'var(--bg-selected)',
        foreground: 'var(--text)',
        'foreground-muted': 'var(--text-muted)',
        'foreground-subtle': 'var(--text-subtle)',
        heading: 'var(--text-heading)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        accent: { DEFAULT: 'var(--accent)', hover: 'var(--accent-hover)' },
        green: {
          50: 'var(--green-50)', 100: 'var(--green-100)', 200: 'var(--green-200)',
          500: 'var(--green-500)', 600: 'var(--green-600)', 700: 'var(--green-700)', 800: 'var(--green-800)',
        },
        red: { 50: 'var(--red-50)', 500: 'var(--red-500)' },
        amber: { 50: 'var(--amber-50)', 500: 'var(--amber-500)' },
        blue: { 50: 'var(--blue-50)', 500: 'var(--blue-500)' },
      },
      borderRadius: { sm: 'var(--radius-sm)', DEFAULT: 'var(--radius)', md: 'var(--radius-md)', lg: 'var(--radius-lg)' },
      fontFamily: { sans: 'var(--font)', mono: 'var(--mono)' },
      ringColor: { accent: 'rgba(59,107,255,0.30)' },
    },
  },
  plugins: [],
};
