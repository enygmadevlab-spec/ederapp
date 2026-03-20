/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sky: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        }
      },
      backgroundColor: {
        'glass': 'rgba(255, 255, 255, 0.04)',
        'glass-nav': 'rgba(2, 12, 27, 0.7)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(14, 165, 233, 0.1)',
      },
      borderColor: {
        'glass': 'rgba(14, 165, 233, 0.2)',
      },
    },
  },
  plugins: [],
}
