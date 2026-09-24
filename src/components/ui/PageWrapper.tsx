import type { ReactNode } from 'react'
import { SectionLabel } from '@/components/ui/section-label'

interface PageWrapperProps {
  children: ReactNode
}

export function PageWrapper({ children }: PageWrapperProps) {
  return <div className="mx-auto w-full max-w-[1400px] px-6 py-6 lg:px-8 lg:py-8">{children}</div>
}

interface PageHeaderProps {
  label: string
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
}

// Cabeçalho padrão de página: SectionLabel + título grande + subtítulo opcional.
// Uso opcional — páginas existentes mantêm seu próprio markup de cabeçalho.
export function PageHeader({ label, title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <SectionLabel>{label}</SectionLabel>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-[var(--text-primary)]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-[var(--text-secondary)]">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
