import type { ReactNode } from 'react'

interface SplitPanelProps {
  darkSide: ReactNode
  lightSide: ReactNode
  flip?: boolean
  className?: string
}

// Padrão "metade escura com glow + metade clara com conteúdo" — reaproveitável
// para empty states e onboarding dentro do app.
export function SplitPanel({ darkSide, lightSide, flip = false, className = '' }: SplitPanelProps) {
  return (
    <div className={`grid grid-cols-1 overflow-hidden rounded-3xl sm:grid-cols-2 ${className}`}>
      <div className={`relative flex items-center justify-center bg-accent-ink p-8 ${flip ? 'sm:order-2' : ''}`}>
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(circle at 50% 30%, rgba(179,92,255,0.25), transparent 70%)' }}
          aria-hidden="true"
        />
        <div className="relative">{darkSide}</div>
      </div>
      <div className="flex items-center justify-center bg-white p-8">{lightSide}</div>
    </div>
  )
}
