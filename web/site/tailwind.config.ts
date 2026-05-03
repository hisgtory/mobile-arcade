import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-bagel)', 'system-ui', 'sans-serif'],
        body: ['var(--font-fredoka)', 'system-ui', 'sans-serif'],
      },
      colors: {
        cream: '#FFF8F0',
        peach: '#FFD6BA',
        cherry: '#FF6B6B',
        lime: '#A0E7A0',
        sky: '#74C0FC',
      },
      boxShadow: {
        soft: '0 8px 24px rgba(0,0,0,0.08)',
        pop: '0 12px 32px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
};

export default config;
