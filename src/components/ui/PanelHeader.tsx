import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

interface PanelHeaderProps {
  title: string
  subtitle?: ReactNode
  action?: ReactNode
}

// Cabeçalho comum dos cards do Dashboard: título, linha de apoio e ação.
export function PanelHeader({ title, subtitle, action }: PanelHeaderProps) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h3 className="font-display text-[16px] font-semibold tracking-tight text-[var(--text-primary)]">{title}</h3>
        {subtitle && <p className="mt-1 text-[13px] text-[var(--text-muted)]">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function PanelLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[var(--border-default)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--text-secondary)] transition hover:border-[var(--accent-ring)] hover:text-[var(--accent-text)]"
    >
      {children}
      <ArrowUpRight className="size-3.5" />
    </Link>
  )
}
