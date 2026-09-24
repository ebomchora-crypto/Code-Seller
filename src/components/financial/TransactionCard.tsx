import { Link } from 'react-router-dom'
import { Tooltip } from '@/components/ui/Tooltip'
import { CategoryBadge } from '@/components/financial/CategoryBadge'
import { formatCurrency, getOverdueStatus, PAYMENT_METHOD_LABELS, RECURRENCE_LABELS, TRANSACTION_STATUS_LABELS } from '@/utils/financial'
import type { Transaction } from '@/types'

interface TransactionCardProps {
  transaction: Transaction
  onEdit: () => void
  onMarkAsPaid: () => void
  onDelete: () => void
}

const statusBadgeClasses: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  paid: 'bg-emerald-50 text-emerald-700',
  overdue: 'bg-red-50 text-red-700',
  cancelled: 'bg-neutral-100 text-neutral-500',
}

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR')
}

export function TransactionCard({ transaction, onEdit, onMarkAsPaid, onDelete }: TransactionCardProps) {
  const overdue = getOverdueStatus(transaction.due_date, transaction.status) === 'overdue'
  const displayStatus = overdue ? 'overdue' : transaction.status

  return (
    <div
      className={`rounded-lg border border-neutral-200 p-4 transition-colors duration-150 ${
        overdue ? 'border-l-2 border-l-red-500' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          <span className={`mt-0.5 text-sm ${transaction.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
            {transaction.type === 'income' ? '↑' : '↓'}
          </span>
          <div className="min-w-0">
            <button type="button" onClick={onEdit} className="truncate text-left text-sm font-medium text-neutral-900 hover:text-purple-700">
              {transaction.description}
            </button>
            {transaction.recurrence !== 'none' && (
              <Tooltip content={`Recorrência ${RECURRENCE_LABELS[transaction.recurrence].toLowerCase()}`}>
                <span className="ml-1.5 text-xs text-neutral-400">↻</span>
              </Tooltip>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <CategoryBadge category={transaction.category} />
              {transaction.contact && (
                <Link to={`/crm/${transaction.contact.id}`} className="text-xs text-purple-600 hover:text-purple-700">
                  {transaction.contact.name}
                </Link>
              )}
              {transaction.deal && (
                <Link to={`/deals/${transaction.deal.id}`} className="text-xs text-purple-600 hover:text-purple-700">
                  {transaction.deal.title}
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className={`text-sm font-medium ${transaction.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
            {transaction.type === 'income' ? '+' : '-'}
            {formatCurrency(transaction.amount)}
          </p>
          <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${statusBadgeClasses[displayStatus]}`}>
            {overdue ? 'Vencido' : TRANSACTION_STATUS_LABELS[transaction.status]}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-neutral-400">
        <span>
          {formatDate(transaction.date)}
          {transaction.payment_method && ` · ${PAYMENT_METHOD_LABELS[transaction.payment_method]}`}
        </span>
        <div className="flex gap-3">
          {transaction.status === 'pending' && (
            <button type="button" onClick={onMarkAsPaid} className="font-medium text-emerald-600 hover:text-emerald-700">
              Marcar como pago
            </button>
          )}
          <button type="button" onClick={onEdit} className="hover:text-neutral-700">
            Editar
          </button>
          <button type="button" onClick={onDelete} className="hover:text-red-600">
            Excluir
          </button>
        </div>
      </div>
    </div>
  )
}
