/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        family: {
          bg: '#F8F9FC',
          primary: '#7467F0',
          primarySoft: '#F1EFFF',
          text: '#1F2430',
          muted: '#7C8292',
          border: '#ECEEF4',
          pink: '#F59BB3',
          blue: '#84B7F4',
          yellow: '#F2C667',
          purple: '#A795F5',
        },
      },
      boxShadow: {
        soft: '0 14px 40px rgba(42, 47, 66, 0.06)',
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
