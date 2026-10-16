/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#090d16',
          surface: '#111823',
          hover: '#141e2e'
        },
        accent: {
          primary: '#00e5ff',
          light: '#66efff',
          dark: '#00b2c7',
          success: '#02917e',
          successText: '#ffffff',
          danger: '#090d16',
          dangerText: '#ffffff',
          erase: '#a00000',
          eraseBorder: '#ffffff'
        },
        slateText: {
          muted: '#a0aec0',
          white: '#ffffff'
        }
      },
      fontFamily: {
        sans: ['Geist', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['Geist Mono', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      },
      boxShadow: {
        'flat-card': '0 4px 20px rgba(0, 0, 0, 0.25)',
        'flat-btn': '0 0 16px 4px rgba(0, 0, 0, 0.35)',
        'subtle-focus': '0 0 0 2px rgba(0, 229, 255, 0.15)',
      }
    },
  },
  plugins: [],
}
