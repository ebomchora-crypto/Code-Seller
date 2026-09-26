import { AlertTriangle, Check, X, Zap } from 'lucide-react'
import type { ProposedAction } from '@/types'

interface ActionBlockProps {
  action: ProposedAction
  onConfirm: () => void
  onReject: () => void
}

// Ação que o CS Copilot quer executar no sistema — nada acontece sem o
// usuário confirmar.
export function ActionBlock({ action, onConfirm, onReject }: ActionBlockProps) {
  if (action.status === 'executed') {
    return (
      <div className="flex animate-fade-in items-start gap-3 rounded-[18px] border border-emerald-500/25 bg-emerald-500/[0.07] p-3.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
          <Check className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-emerald-600 dark:text-emerald-400">Feito</p>
          <p className="mt-0.5 text-[13.5px] text-[var(--text-secondary)]">{action.label}</p>
        </div>
      </div>
    )
  }

  if (action.status === 'rejected') {
    return (
      <div className="flex animate-fade-in items-start gap-3 rounded-[18px] border border-[var(--border-subtle)] p-3.5 opacity-70">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-muted)] text-[var(--text-muted)]">
          <X className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-[var(--text-muted)]">Recusada</p>
          <p className="mt-0.5 text-[13.5px] text-[var(--text-muted)] line-through">{action.label}</p>
        </div>
      </div>
    )
  }

  if (action.status === 'failed') {
    return (
      <div className="flex animate-fade-in items-start gap-3 rounded-[18px] border border-red-500/25 bg-red-500/[0.07] p-3.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-red-500">
          <AlertTriangle className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-red-600 dark:text-red-400">Não deu certo</p>
          <p className="mt-0.5 text-[13.5px] text-[var(--text-secondary)]">{action.label}</p>
          <button
            type="button"
            onClick={onConfirm}
            className="mt-3 inline-flex h-8 items-center rounded-full border border-red-500/30 px-3.5 text-[12.5px] font-medium text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in rounded-[18px] border border-[var(--accent-ring)] bg-[var(--accent-tint)] p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#8b5cf6,#6d28d9)] text-white">
          <Zap className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[var(--accent-text)]">Ação sugerida</p>
          <p className="mt-0.5 text-[14px] font-semibold text-[var(--text-primary)]">{action.label}</p>
          {action.description && <p className="mt-0.5 text-[13px] text-[var(--text-secondary)]">{action.description}</p>}
        </div>
      </div>
      <div className="mt-3.5 flex gap-2 pl-11">
        <button
          type="button"
          onClick={onConfirm}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[linear-gradient(135deg,#8b5cf6,#6d28d9)] px-4 text-[13px] font-medium text-white shadow-[0_8px_20px_-10px_rgba(124,58,237,0.9)] transition hover:brightness-110"
        >
          <Check className="size-3.5" />
          Confirmar
        </button>
        <button
          type="button"
          onClick={onReject}
          className="inline-flex h-9 items-center rounded-full border border-[var(--border-default)] bg-[var(--bg-card)] px-4 text-[13px] font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
        >
          Recusar
        </button>
      </div>
    </div>
  )
}
