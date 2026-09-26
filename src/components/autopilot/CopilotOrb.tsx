import { SilkRibbons } from '@/components/auth/SilkRibbons'

const SIZES = {
  sm: 'size-8',
  md: 'size-10',
  lg: 'size-20',
}

// Marca do CS Copilot: uma esfera com o mesmo tecido roxo do login e do
// menu, girando devagar. `thinking` acelera o brilho enquanto a IA responde.
export function CopilotOrb({ size = 'md', thinking = false }: { size?: keyof typeof SIZES; thinking?: boolean }) {
  return (
    <span
      className={`relative isolate block shrink-0 overflow-hidden rounded-full ring-1 ring-white/15 ${SIZES[size]} ${
        size === 'lg' ? 'shadow-[0_0_60px_-6px_rgba(139,92,246,0.75)]' : 'shadow-[0_4px_16px_-4px_rgba(139,92,246,0.7)]'
      } ${thinking ? 'animate-pulse' : ''}`}
      aria-hidden
    >
      <SilkRibbons className="absolute inset-0 h-full w-full scale-150 animate-silk-drift" />
      <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.45),transparent_45%)]" />
    </span>
  )
}
