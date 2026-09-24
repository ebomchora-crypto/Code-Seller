import { AlertTriangle, Check, X, Zap } from 'lucide-react'
import type { ProposedAction } from '@/types'

interface ActionBlockProps {
  action: ProposedAction
  onConfirm: () => void
  onReject: () => void
}

export function ActionBlock({ action, onConfirm, onReject }: ActionBlockProps) {
  if (action.status === 'executed') {
    return (
      <div className="animate-fade-in rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.08] p-3 transition-colors duration-300">
        <p className="flex items-center gap-2 text-sm font-medium text-emerald-500">
          <Check className="h-4 w-4" /> Ação executada
        </p>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{action.label}</p>
      </div>
    )
  }

  if (action.status === 'rejected') {
    return (
      <div className="animate-fade-in rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-3 opacity-60">
        <p className="flex items-center gap-2 text-sm font-medium text-[var(--text-muted)]">
          <X className="h-4 w-4" /> Ação rejeitada
        </p>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{action.label}</p>
      </div>
    )
  }

  if (action.status === 'failed') {
    return (
      <div className="animate-fade-in rounded-2xl border border-red-500/20 bg-red-500/[0.08] p-3">
        <p className="flex items-center gap-2 text-sm font-medium text-red-500">
          <AlertTriangle className="h-4 w-4" /> Falha ao executar
        </p>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{action.label}</p>
        <button
          type="button"
          onClick={onConfirm}
          className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-500 transition-colors hover:bg-red-500/20"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="animate-fade-in rounded-2xl border border-purple-500/25 bg-[var(--purple-soft)] p-4">
      <p className="flex items-center gap-2 text-sm font-medium text-purple-500">
        <Zap className="h-4 w-4" /> Ação proposta
      </p>
      <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">{action.label}</p>
      <p className="mt-0.5 text-sm text-[var(--text-muted)]">{action.description}</p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-xl border border-purple-500/40 bg-purple-600 px-4 py-2 text-sm text-white transition-all hover:bg-purple-500"
        >
          Confirmar
        </button>
        <button
          type="button"
          onClick={onReject}
          className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-muted)] px-4 py-2 text-sm text-[var(--text-muted)] transition-all hover:bg-[var(--bg-card-hover)]"
        >
          Rejeitar
        </button>
      </div>
    </div>
  )
}
