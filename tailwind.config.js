/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
        },
        surface: {
          0: '#FFFFFF',
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
        },
        ink: {
          900: '#0F172A',
          700: '#334155',
          500: '#64748B',
          300: '#94A3B8',
          100: '#CBD5E1',
        },
        danger: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
        },
        warning: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          400: '#FB923C',
          500: '#F97316',
        },
        info: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          600: '#2563EB',
        },
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)',
        'elevated': '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04)',
        'modal': '0 25px 50px -12px rgba(0,0,0,0.15)',
      },
      spacing: {
        '4.5': '1.125rem',
        '13': '3.25rem',
        '15': '3.75rem',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
    },
  },
  plugins: [],
};
