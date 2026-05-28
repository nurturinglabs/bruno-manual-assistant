import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        bruno: {
          navy: '#0f2d54',
          mid: '#1a4f8a',
          light: '#e8f0f8',
          muted: '#7fa8d4',
          border: '#b5d0ec',
        },
      },
    },
  },
  plugins: [],
};
export default config;
