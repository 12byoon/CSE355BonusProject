/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Muted academic state palette
        q0:   '#4f7ec9',  // muted blue   — push phase
        q1:   '#b07d1a',  // warm amber   — comparison phase
        q2:   '#c0622b',  // terracotta   — drain phase
        q3:   '#2e8f62',  // sage green   — accept state
        dead: '#94a3b8',  // light slate  — dead / inactive
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
