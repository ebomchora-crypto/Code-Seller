import { RefreshCw } from 'lucide-react'
import type { AutoPilotContext } from '@/types'

interface ContextBadgeProps {
  context: AutoPilotContext | null
  onRefresh: () => void
  refreshing?: boolean
}

export function ContextBadge({ context, onRefresh, refreshing = false }: ContextBadgeProps) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-purple-500/20 bg-[var(--purple-soft)] py-1 pl-3 pr-1 text-xs text-purple-500">
      {context ? (
        <span className="hidden sm:inline">
          Contexto: {context.summary.total_contacts} contatos · {context.summary.active_deals} deals ·{' '}
          {context.summary.pending_tasks} tarefas
        </span>
      ) : (
        <span>Carregando…</span>
      )}
      <button
        type="button"
        onClick={onRefresh}
        aria-label="Atualizar contexto"
        className="flex h-6 w-6 items-center justify-center rounded-full text-purple-500 transition-colors hover:bg-purple-500/20"
      >
        <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
      </button>
    </div>
  )
}
