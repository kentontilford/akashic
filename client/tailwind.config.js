module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        helvetica: ['Helvetica Neue', 'Aptos', 'sans-serif']
      },
      colors: {
        primary: '#1A2B42',
        secondary: '#F8F9FB',
        accent: '#60A5FA',
        highlight: '#C4B5FD'
      }
    }
  },
  plugins: []
}
