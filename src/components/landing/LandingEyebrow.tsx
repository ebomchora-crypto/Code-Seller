import type { ReactNode } from 'react'

// Label "• PALAVRA" usado em toda a landing — isolado do `Eyebrow`
// compartilhado (usado também no app autenticado) porque a paleta aqui é
// diferente. `tone='light'` é só pra seção de fundo claro (Problema).
export function LandingEyebrow({ children, tone = 'dark' }: { children: ReactNode; tone?: 'dark' | 'light' }) {
  const isLight = tone === 'light'
  return (
    <div className="inline-flex items-center gap-2">
      <span
        className={`h-1.5 w-1.5 rounded-full ${isLight ? 'bg-landing-deep' : 'bg-landing-primary-hover shadow-[0_0_10px_rgba(139,92,246,0.6)]'}`}
      />
      <span
        className={`text-xs font-semibold uppercase tracking-[0.16em] ${isLight ? 'text-landing-deep' : 'text-landing-primary-hover'}`}
      >
        {children}
      </span>
    </div>
  )
}
