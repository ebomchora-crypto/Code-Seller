import type { ReactNode } from 'react'

// Versão local do padrão "• LABEL" já usado no resto do app (ver
// components/ui/eyebrow.tsx), mas na paleta dark-premium da landing — o
// componente compartilhado usa `accent-bright`/`accent-500`, que não fazem
// parte da paleta pedida pro redesign. Isolado aqui pra não alterar o
// componente usado no app autenticado (Header.tsx também o importa).
export function LandingEyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2">
      <span className="h-1.5 w-1.5 rounded-full bg-landing-primary-hover shadow-[0_0_10px_rgba(139,92,246,0.6)]" />
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-landing-primary-hover">{children}</span>
    </div>
  )
}
