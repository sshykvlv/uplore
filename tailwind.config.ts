import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#fbfbfa',
        card: '#ffffff',
        line: '#ececea',
        ink: '#1a1a18',
        muted: '#8a8a84',
        accent: '#e8602c',
        'accent-soft': '#fdeee7',
        icon: '#b4b4ae',
      },
      borderRadius: {
        pill: '9999px',
        card: '14px',
        bar: '16px',
      },
    },
  },
  plugins: [],
}

export default config
