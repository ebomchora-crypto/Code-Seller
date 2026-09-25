import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta "purple" remapeada para os valores exatos da identidade
        // Code Sellers (extraídos por conversão H/S/L do site de referência,
        // hue rotacionado de vermelho para roxo — 272°). Mantemos o nome
        // `purple` porque é usado em ~90 arquivos como a cor de marca; alterar
        // apenas os valores aqui aplica a paleta exata em todo o app sem
        // precisar renomear cada classe.
        purple: {
          50: '#faf5ff',
          100: '#ecd6ff', // = accent-soft
          200: '#d9adff',
          300: '#c47fff',
          400: '#b35cff', // = accent-bright
          500: '#5f00b2', // = accent (principal)
          600: '#4d0092',
          700: '#3b0072',
          800: '#2c0052', // = accent-deep
          900: '#0b0014', // = accent-ink
        },
        // Alias com o nome usado na especificação de design, para componentes
        // novos — mesmos valores exatos de `purple` acima.
        accent: {
          ink: '#0b0014',
          deep: '#2c0052',
          DEFAULT: '#5f00b2',
          bright: '#b35cff',
          soft: '#ecd6ff',
          50: '#faf5ff',
          100: '#ecd6ff',
          200: '#d9adff',
          300: '#c47fff',
          400: '#b35cff',
          500: '#5f00b2',
          600: '#4d0092',
          700: '#3b0072',
          800: '#2c0052',
          900: '#0b0014',
        },
        paper: {
          DEFAULT: '#f5f3f2',
          dark: '#efece9',
        },
        ink: {
          DEFAULT: '#0a0a0c',
          soft: '#131316',
        },
        neutral: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        },
        background: {
          primary: '#ffffff',
          secondary: '#fafafa',
          muted: '#f4f4f5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Sora', 'sans-serif'],
        // Geométrica/arredondada, bem mais pesada que a Sora — reservada
        // para o headline do Hero da landing (referência visual pedida),
        // não substitui a font-display usada no resto do app.
        hero: ['Outfit', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '12px',
        lg: '20px',
        xl: '40px',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'glass-strong': '0 16px 48px rgba(0, 0, 0, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        'glass-purple': '0 0 40px rgba(179, 92, 255, 0.08), inset 0 1px 0 rgba(179, 92, 255, 0.1)',
        'purple-glow': '0 0 60px rgba(179, 92, 255, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.25s ease-out',
        'float-up': 'float-up 0.3s ease-out',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'dot-bounce': 'dot-bounce 1s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
        'radar-ping': 'radar-ping 2.4s cubic-bezier(0.16, 1, 0.3, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'float-up': {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(179, 92, 255, 0.1)' },
          '50%': { boxShadow: '0 0 40px rgba(179, 92, 255, 0.25)' },
        },
        'dot-bounce': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.4' },
          '50%': { transform: 'scale(1.4)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'radar-ping': {
          '0%': { transform: 'scale(0.4)', opacity: '0.6' },
          '100%': { transform: 'scale(1.8)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
