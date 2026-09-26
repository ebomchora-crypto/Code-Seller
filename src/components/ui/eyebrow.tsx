import type { ReactNode } from 'react'

interface EyebrowProps {
  children: ReactNode
  /** dark = sobre fundo escuro (texto claro, ex: CS Copilot); light = sobre
   * fundo claro (texto accent, resto do app). */
  variant?: 'light' | 'dark'
}

// Réplica do padrão "• LABEL EM UPPERCASE" da referência. `purple-400` é o
// exato accent-bright (#b35cff) e `purple-500` o accent principal (#5f00b2) —
// ver a paleta remapeada em tailwind.config.ts.
export function Eyebrow({ children, variant = 'light' }: EyebrowProps) {
  const isDark = variant === 'dark'

  return (
    <div className="inline-flex items-center gap-2">
      <span className={`h-1.5 w-1.5 rounded-full ${isDark ? 'bg-accent-bright shadow-[0_0_12px_#b35cff]' : 'bg-accent-500'}`} />
      <span className={`text-xs font-semibold uppercase tracking-[0.14em] ${isDark ? 'text-accent-bright' : 'text-accent-500'}`}>
        {children}
      </span>
    </div>
  )
}
