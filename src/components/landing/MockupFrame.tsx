import type { ReactNode } from 'react'

interface MockupFrameProps {
  label: string
  children: ReactNode
  className?: string
}

// Moldura compartilhada por todos os mockups de UI originais da landing
// (gerador, pipeline, Code Hunter, proposta...) — mesma "janela" de app
// (barra de pontos + label mono), pra tudo parecer parte do mesmo sistema
// em vez de peças soltas com estilos diferentes.
export function MockupFrame({ label, children, className = '' }: MockupFrameProps) {
  return (
    <div className={`overflow-hidden rounded-landing-lg border border-white/10 bg-[#0b0710] shadow-landing-card ${className}`}>
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
        </div>
        <span className="font-mono text-[11px] uppercase tracking-wide text-landing-text-muted">{label}</span>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </div>
  )
}
