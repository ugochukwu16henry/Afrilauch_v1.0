import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // RiseFlow Hub brand (from specs)
        primary: '#0FA958',   // Emerald Green - growth, global potential
        secondary: '#0B3C5D', // Deep Tech Blue - trust, professionalism
        accent: '#F4B400',   // Warm Gold - opportunity, CTAs
        background: '#F7F9FB',
        'text-dark': '#1E1E1E',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
