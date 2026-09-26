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

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#8b5cf6,#5b21b6)',
  'linear-gradient(135deg,#6366f1,#3730a3)',
  'linear-gradient(135deg,#d946ef,#86198f)',
  'linear-gradient(135deg,#0ea5e9,#1e40af)',
  'linear-gradient(135deg,#10b981,#065f46)',
]

// Iniciais com uma cor estável por nome, pra lista não ficar monocromática.
export function InitialsAvatar({ name }: { name: string }) {
  const words = name.trim().split(/\s+/)
  const initials = (words.length > 1 ? `${words[0][0]}${words[1][0]}` : name.slice(0, 2)).toUpperCase()
  const hash = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return (
    <span
      className="flex size-10 shrink-0 items-center justify-center rounded-xl text-[12.5px] font-semibold text-white"
      style={{ background: AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length] }}
    >
      {initials}
    </span>
  )
}
