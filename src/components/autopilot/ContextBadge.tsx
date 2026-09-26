import { Briefcase, CheckSquare, RefreshCw, Users } from 'lucide-react'
import type { AutoPilotContext } from '@/types'

interface ContextBadgeProps {
  context: AutoPilotContext | null
  onRefresh: () => void
  refreshing?: boolean
}

// O que o CS Copilot está enxergando agora, com botão para reler os dados.
export function ContextBadge({ context, onRefresh, refreshing = false }: ContextBadgeProps) {
  const items = context
    ? [
        { icon: Users, value: context.summary.total_contacts, label: 'contatos' },
        { icon: Briefcase, value: context.summary.active_deals, label: 'negócios ativos' },
        { icon: CheckSquare, value: context.summary.pending_tasks, label: 'tarefas pendentes' },
      ]
    : []

  return (
    <div className="flex items-center gap-1 rounded-full border border-[var(--border-default)] bg-[var(--bg-card)] py-1 pl-3 pr-1 text-[12.5px] text-[var(--text-secondary)]">
      {context ? (
        <span className="flex items-center gap-3">
          {items.map((item) => (
            <span key={item.label} className="flex items-center gap-1.5" title={`${item.value} ${item.label}`}>
              <item.icon className="size-3.5 text-[var(--text-muted)]" />
              <span className="font-semibold tabular-nums text-[var(--text-primary)]">{item.value}</span>
            </span>
          ))}
        </span>
      ) : (
        <span>Carregando dados…</span>
      )}
      <button
        type="button"
        onClick={onRefresh}
        aria-label="Reler meus dados"
        title="Reler meus dados"
        className="ml-1 flex size-7 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
      >
        <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`} />
      </button>
    </div>
  )
}
