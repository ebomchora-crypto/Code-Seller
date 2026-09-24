import { useState } from 'react'
import { Link } from 'react-router-dom'
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

const statusLabels: Record<Receivable['status'], string> = {
  pending: 'Pendente',
  paid: 'Pago',
  overdue: 'Vencido',
  cancelled: 'Cancelado',
}

const statusClasses: Record<Receivable['status'], string> = {
  pending: 'bg-amber-50 text-amber-700',
  paid: 'bg-emerald-50 text-emerald-700',
  overdue: 'bg-red-50 text-red-700',
  cancelled: 'bg-neutral-100 text-neutral-500',
}

function dueDateIndicatorClass(dueDate: string | null, status: Receivable['status']): string {
  if (status === 'paid') return 'text-emerald-600'
  if (status === 'cancelled') return 'text-neutral-400'
  if (!dueDate) return 'text-neutral-400'

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(`${dueDate}T00:00:00`)
  const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'text-red-600'
  if (diffDays <= 7) return 'text-amber-600'
  return 'text-neutral-500'
}

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR')
}

export function ReceivableCard({ receivable, onMarkAsPaid, onUpdateDueDate, onCancel }: ReceivableCardProps) {
  const [editingDueDate, setEditingDueDate] = useState(false)
  const [dueDateValue, setDueDateValue] = useState(receivable.due_date ?? '')

  function handleSaveDueDate() {
    if (dueDateValue) onUpdateDueDate(dueDateValue)
    setEditingDueDate(false)
  }

  return (
    <div className="rounded-lg border border-neutral-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {receivable.deal && (
            <Link to={`/deals/${receivable.deal.id}`} className="block truncate text-sm font-medium text-neutral-900 hover:text-purple-700">
              {receivable.deal.title}
            </Link>
          )}
          {receivable.contact && (
            <Link to={`/crm/${receivable.contact.id}`} className="text-xs text-purple-600 hover:text-purple-700">
              {receivable.contact.name}
            </Link>
          )}
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusClasses[receivable.status]}`}>
          {statusLabels[receivable.status]}
        </span>
      </div>

      <p className="mt-2 text-lg font-medium text-neutral-900">{formatCurrency(receivable.amount)}</p>

      {editingDueDate ? (
        <div className="mt-2 flex items-center gap-2">
          <Input type="date" value={dueDateValue} onChange={(event) => setDueDateValue(event.target.value)} />
          <Button size="sm" onClick={handleSaveDueDate}>
            Salvar
          </Button>
        </div>
      ) : (
        <p className={`mt-1 text-xs font-medium ${dueDateIndicatorClass(receivable.due_date, receivable.status)}`}>
          {receivable.due_date ? `Vence em ${formatDate(receivable.due_date)}` : 'Sem vencimento definido'}
        </p>
      )}

      {receivable.status === 'pending' && !editingDueDate && (
        <div className="mt-3 flex gap-3 text-xs font-medium">
          <button type="button" onClick={onMarkAsPaid} className="text-emerald-600 hover:text-emerald-700">
            Marcar como pago
          </button>
          <button type="button" onClick={() => setEditingDueDate(true)} className="text-neutral-500 hover:text-neutral-700">
            Editar vencimento
          </button>
          <button type="button" onClick={onCancel} className="text-neutral-500 hover:text-red-600">
            Cancelar
          </button>
        </div>
      )}
    </div>
  )
}
