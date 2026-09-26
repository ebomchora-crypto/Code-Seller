import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, CheckCircle2, X } from 'lucide-react'
import { StatusPill } from '@/components/financial/StatusPill'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/utils/financial'
import type { Receivable } from '@/types'

interface ReceivableCardProps {
  receivable: Receivable
  onMarkAsPaid: () => void
  onUpdateDueDate: (due_date: string) => void
  onCancel: () => void
}

function dueDateIndicatorClass(dueDate: string | null, status: Receivable['status']): string {
  if (status === 'paid') return 'text-emerald-600 dark:text-emerald-400'
  if (status === 'cancelled') return 'text-[var(--text-muted)]'
  if (!dueDate) return 'text-[var(--text-muted)]'

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(`${dueDate}T00:00:00`)
  const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'text-red-600 dark:text-red-400'
  if (diffDays <= 7) return 'text-amber-600 dark:text-amber-400'
  return 'text-[var(--text-muted)]'
}

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
}

export function ReceivableCard({ receivable, onMarkAsPaid, onUpdateDueDate, onCancel }: ReceivableCardProps) {
  const [editingDueDate, setEditingDueDate] = useState(false)
  const [dueDateValue, setDueDateValue] = useState(receivable.due_date ?? '')

  function handleSaveDueDate() {
    if (dueDateValue) onUpdateDueDate(dueDateValue)
    setEditingDueDate(false)
  }

  const overdue =
    receivable.status === 'pending' &&
    Boolean(receivable.due_date) &&
    new Date(`${receivable.due_date}T00:00:00`) < new Date(new Date().setHours(0, 0, 0, 0))

  return (
    <div className="rounded-[18px] border border-[var(--border-default)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {receivable.deal ? (
            <Link
              to={`/deals/${receivable.deal.id}`}
              className="block truncate text-[14px] font-semibold text-[var(--text-primary)] hover:text-[var(--accent-text)]"
            >
              {receivable.deal.title}
            </Link>
          ) : (
            <p className="truncate text-[14px] font-semibold text-[var(--text-primary)]">{receivable.description}</p>
          )}
          {receivable.contact && (
            <Link to={`/crm/${receivable.contact.id}`} className="text-[12.5px] text-[var(--text-muted)] hover:text-[var(--accent-text)]">
              {receivable.contact.name}
            </Link>
          )}
        </div>
        <StatusPill status={overdue ? 'overdue' : receivable.status} />
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="font-display text-[20px] font-bold leading-none tabular-nums text-[var(--text-primary)]">
          {formatCurrency(receivable.amount)}
        </p>
        {!editingDueDate && (
          <p className={`flex items-center gap-1 text-[12.5px] font-medium ${dueDateIndicatorClass(receivable.due_date, receivable.status)}`}>
            <CalendarDays className="size-3.5" />
            {receivable.due_date ? `Vence ${formatDate(receivable.due_date)}` : 'Sem vencimento'}
          </p>
        )}
      </div>

      {editingDueDate && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1">
            <Input type="date" aria-label="Novo vencimento" value={dueDateValue} onChange={(event) => setDueDateValue(event.target.value)} />
          </div>
          <Button size="sm" className="h-11 rounded-xl px-4" onClick={handleSaveDueDate}>
            Salvar
          </Button>
        </div>
      )}

      {receivable.status === 'pending' && !editingDueDate && (
        <div className="mt-3.5 flex items-center gap-1.5 border-t border-[var(--border-subtle)] pt-3">
          <button
            type="button"
            onClick={onMarkAsPaid}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 text-[12.5px] font-medium text-emerald-600 transition hover:bg-emerald-500/20 dark:text-emerald-400"
          >
            <CheckCircle2 className="size-3.5" />
            Recebi
          </button>
          <button
            type="button"
            onClick={() => setEditingDueDate(true)}
            className="inline-flex h-8 items-center rounded-full px-3 text-[12.5px] font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)]"
          >
            Vencimento
          </button>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancelar esta conta a receber"
            title="Cancelar"
            className="ml-auto flex size-8 items-center justify-center rounded-full text-[var(--text-muted)] transition hover:bg-red-500/10 hover:text-red-500"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
    </div>
  )
}
