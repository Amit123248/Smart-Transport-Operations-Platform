/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#12151A',
        paper: '#F3F3EF',
        panel: '#FFFFFF',
        console: '#171A20',
        'console-line': '#2A2F38',
        line: '#E4E2DA',
        muted: '#787A72',
        accent: {
          DEFAULT: '#FF5A1F',
          50: '#FFF1EA',
          100: '#FFE0CF',
          600: '#E64A14',
        },
        signal: {
          go: '#128A6E',
          hold: '#E0A800',
          stop: '#D53B3B',
          idle: '#8A8F98',
          transit: '#2F6FE0',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '14px',
      },
      boxShadow: {
        panel: '0 1px 2px rgba(18,21,26,0.04), 0 1px 0 rgba(18,21,26,0.03)',
        lift: '0 8px 24px rgba(18,21,26,0.10)',
      },
    },
  },
  plugins: [],
};
