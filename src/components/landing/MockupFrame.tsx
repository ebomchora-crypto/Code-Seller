import type { ReactNode } from 'react'

interface MockupFrameProps {
  label: string
  children: ReactNode
  className?: string
}

// Janela de app dos mockups dos módulos — mesma linguagem da janela de
// código da referência (um ponto aceso + dois apagados, label em caixa alta).
export function MockupFrame({ label, children, className = '' }: MockupFrameProps) {
  return (
    <div
      className={`overflow-hidden rounded-[18px] border border-white/[0.12] bg-[rgba(14,10,24,0.88)] shadow-[0_30px_80px_rgba(0,0,0,0.55),0_0_60px_rgba(124,58,237,0.2)] backdrop-blur-md ${className}`}
    >
      <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-3.5">
        <div className="flex gap-2">
          <span className="size-2.5 rounded-full bg-[#a78bfa]" />
          <span className="size-2.5 rounded-full bg-white/20" />
          <span className="size-2.5 rounded-full bg-white/20" />
        </div>
        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/40">{label}</span>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </div>
  )
}
