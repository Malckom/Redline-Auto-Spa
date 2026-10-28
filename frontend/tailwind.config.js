export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: '#050505', panel: '#0d0d0d', line: '#26262a',
        platinum: '#e5e7eb', steel: '#9ca3af', redline: { DEFAULT: '#dc2626', hot: '#ef4444' },
      },
      fontFamily: { display: ['Saira', 'sans-serif'], body: ['"Hanken Grotesk"', 'sans-serif'] },
    },
  },
  plugins: [],
};
