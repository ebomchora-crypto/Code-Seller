import { Link } from 'react-router-dom'
import { ArrowDownRight, ArrowUpRight, CheckCircle2, Pencil, Repeat, Trash2 } from 'lucide-react'
import { CategoryBadge } from '@/components/financial/CategoryBadge'
import { StatusPill } from '@/components/financial/StatusPill'
import { formatCurrency, getOverdueStatus, PAYMENT_METHOD_LABELS, RECURRENCE_LABELS } from '@/utils/financial'
import type { Transaction } from '@/types'

interface TransactionCardProps {
  transaction: Transaction
  onEdit: () => void
  onMarkAsPaid: () => void
  onDelete: () => void
}

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
}

const iconButton = 'flex size-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-muted)]'

// Transação no celular: mesma informação da tabela, empilhada.
export function TransactionCard({ transaction, onEdit, onMarkAsPaid, onDelete }: TransactionCardProps) {
  const overdue = getOverdueStatus(transaction.due_date, transaction.status) === 'overdue'
  const income = transaction.type === 'income'

  return (
    <div className="flex items-start gap-3 px-6 py-4">
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
          income ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
        }`}
      >
        {income ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <button type="button" onClick={onEdit} className="flex min-w-0 items-center gap-1.5 text-left font-medium text-[var(--text-primary)]">
            <span className="truncate">{transaction.description}</span>
            {transaction.recurrence !== 'none' && (
              <span title={`Recorrência ${RECURRENCE_LABELS[transaction.recurrence].toLowerCase()}`}>
                <Repeat className="size-3.5 shrink-0 text-[var(--text-muted)]" />
              </span>
            )}
          </button>
          <span
            className={`shrink-0 font-display font-semibold tabular-nums ${
              income ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--text-primary)]'
            }`}
          >
            {income ? '+' : '−'}
            {formatCurrency(transaction.amount)}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[var(--text-muted)]">
          <span>{formatDate(transaction.date)}</span>
          {transaction.payment_method && <span>· {PAYMENT_METHOD_LABELS[transaction.payment_method]}</span>}
          <CategoryBadge category={transaction.category} />
          {transaction.contact && (
            <Link to={`/crm/${transaction.contact.id}`} className="hover:text-[var(--accent-text)]">
              {transaction.contact.name}
            </Link>
          )}
          {transaction.deal && (
            <Link to={`/deals/${transaction.deal.id}`} className="hover:text-[var(--accent-text)]">
              {transaction.deal.title}
            </Link>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <StatusPill status={overdue ? 'overdue' : transaction.status} />
          <div className="-mr-2 flex gap-1">
            {transaction.status === 'pending' && (
              <button type="button" onClick={onMarkAsPaid} aria-label="Marcar como pago" title="Marcar como pago" className={`${iconButton} hover:text-emerald-500`}>
                <CheckCircle2 className="size-4" />
              </button>
            )}
            <button type="button" onClick={onEdit} aria-label="Editar" title="Editar" className={`${iconButton} hover:text-[var(--accent-text)]`}>
              <Pencil className="size-4" />
            </button>
            <button type="button" onClick={onDelete} aria-label="Excluir" title="Excluir" className={`${iconButton} hover:text-red-500`}>
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
