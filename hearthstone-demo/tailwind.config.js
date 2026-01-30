/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'hearthstone': {
          'bg': '#0F172A',
          'surface': '#1E293B',
          'border': '#334155',
          'emergency': '#EF4444',
          'critical': '#DC2626',
          'high': '#F97316',
          'medium': '#EAB308',
          'low': '#3B82F6',
          'success': '#22C55E',
        }
      },
      fontFamily: {
        'display': ['Space Grotesk', 'system-ui', 'sans-serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
