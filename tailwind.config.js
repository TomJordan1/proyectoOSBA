/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      colors: {
        // Sistema de diseño "Calma Digital" (DESIGN.md)
        lindy: {
          bg: '#080C14', // Azul marino profundo nocturno
          card: 'rgba(15, 23, 42, 0.65)',
          border: 'rgba(255, 255, 255, 0.08)',
          cyan: '#22D3EE', // Cian neón resplandeciente
          glow: '#06B6D4',
        },
      },
      boxShadow: {
        glow: '0 0 25px rgba(6, 182, 212, 0.35)',
        'glow-lg': '0 0 40px rgba(6, 182, 212, 0.6)',
        'card-glow': '0 0 40px rgba(6, 182, 212, 0.35)',
        'card-glow-strong': '0 0 50px rgba(6, 182, 212, 0.5)',
      },
      keyframes: {
        rotation: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        roundness: {
          '0%, 100%': { filter: 'contrast(15)' },
          '20%, 40%': { filter: 'contrast(3)' },
          '60%': { filter: 'contrast(15)' },
        },
        colorize: {
          '0%, 100%': { filter: 'hue-rotate(0deg)' },
          '20%': { filter: 'hue-rotate(-15deg)' },
          '40%': { filter: 'hue-rotate(-30deg)' },
          '60%': { filter: 'hue-rotate(-45deg)' },
          '80%': { filter: 'hue-rotate(-20deg)' },
        },
      },
    },
  },
  plugins: [],
}
