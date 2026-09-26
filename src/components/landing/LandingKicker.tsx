import type { ReactNode } from 'react'

interface LandingKickerProps {
  children: ReactNode
  tone?: 'paper' | 'dark'
  align?: 'responsive' | 'center'
}

// Rótulo "• PALAVRA" das seções pós-hero — separado do LandingEyebrow (que
// o Hero e o bloco "O ciclo que gera receita" usam e não podem mudar).
export function LandingKicker({ children, tone = 'paper', align = 'responsive' }: LandingKickerProps) {
  const dark = tone === 'dark'
  return (
    <div
      className={`mb-5 flex items-center gap-3 text-[12px] font-medium uppercase tracking-[0.18em] ${
        align === 'center' ? 'justify-center' : 'justify-center lg:justify-start'
      } ${dark ? 'text-[#c4b5fd]' : 'text-[#5b21b6]'}`}
    >
      <span
        className={`size-2 rounded-full ${dark ? 'bg-[#a78bfa] shadow-[0_0_16px_rgba(167,139,250,0.85)]' : 'bg-[#6d28d9]'}`}
      />
      {children}
    </div>
  )
}
