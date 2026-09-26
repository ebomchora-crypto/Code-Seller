import type { ReactNode } from 'react'

interface PageWrapperProps {
  children: ReactNode
}

export function PageWrapper({ children }: PageWrapperProps) {
  return <div className="mx-auto w-full max-w-[1400px] px-5 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
}

interface PageHeaderProps {
  title: ReactNode
  /** Número ao lado do título (ex: total de contatos). */
  count?: number
  subtitle?: ReactNode
  actions?: ReactNode
}

// Cabeçalho padrão das telas redesenhadas: título grande, contador opcional,
// linha de apoio e ações à direita. A seção já aparece no breadcrumb do topo.
export function PageHeader({ title, count, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <h1 className="flex items-center gap-3 font-display text-[30px] font-bold leading-tight tracking-tight text-[var(--text-primary)] sm:text-[34px]">
          {title}
          {count !== undefined && (
            <span className="rounded-full border border-[var(--border-default)] bg-[var(--bg-card)] px-2.5 py-0.5 font-sans text-[13px] font-semibold tabular-nums text-[var(--text-secondary)]">
              {count}
            </span>
          )}
        </h1>
        {subtitle && <p className="mt-1.5 max-w-xl text-[14.5px] text-[var(--text-muted)]">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2.5 lg:flex-nowrap">{actions}</div>}
    </div>
  )
}
