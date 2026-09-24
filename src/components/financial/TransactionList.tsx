import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CategoryBadge } from '@/components/financial/CategoryBadge'
import { TransactionFilters } from '@/components/financial/TransactionFilters'
import { TransactionCard } from '@/components/financial/TransactionCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Button } from '@/components/ui/Button'
import { Tooltip } from '@/components/ui/Tooltip'
import {
  formatCurrency,
  getOverdueStatus,
  PAYMENT_METHOD_LABELS,
  RECURRENCE_LABELS,
  TRANSACTION_STATUS_LABELS,
} from '@/utils/financial'
import type { FinancialCategory, Transaction, TransactionFilters as TransactionFiltersType } from '@/types'

interface TransactionListProps {
  transactions: Transaction[]
  loading: boolean
  error?: string | null
  onRetry?: () => void
  categories: FinancialCategory[]
  filters: TransactionFiltersType
  onFilterChange: (next: Partial<TransactionFiltersType>) => void
  onClearFilters: () => void
  hasActiveFilters: boolean
  onEdit: (transaction: Transaction) => void
  onMarkAsPaid: (id: string) => void
  onDeleteRequest: (transaction: Transaction) => void
  onCreateTransaction: () => void
}

type QuickTab = 'all' | 'income' | 'expense' | 'pending' | 'paid' | 'overdue'

const TABS: { key: QuickTab; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'income', label: 'Entradas' },
  { key: 'expense', label: 'Saídas' },
  { key: 'pending', label: 'Pendentes' },
  { key: 'paid', label: 'Pagas' },
  { key: 'overdue', label: 'Vencidas' },
]

const statusBadgeClasses: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  paid: 'bg-emerald-50 text-emerald-700',
  overdue: 'bg-red-50 text-red-700',
  cancelled: 'bg-neutral-100 text-neutral-500',
}

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR')
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, index) => (
        <tr key={index} className="border-b border-neutral-100">
          {Array.from({ length: 7 }).map((_column, columnIndex) => (
            <td key={columnIndex} className="px-4 py-3">
              <Skeleton className="h-4 w-full max-w-[110px]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export function TransactionList({
  transactions,
  loading,
  error,
  onRetry,
  categories,
  filters,
  onFilterChange,
  onClearFilters,
  hasActiveFilters,
  onEdit,
  onMarkAsPaid,
  onDeleteRequest,
  onCreateTransaction,
}: TransactionListProps) {
  const [activeTab, setActiveTab] = useState<QuickTab>('all')

  function handleTabChange(tab: QuickTab) {
    setActiveTab(tab)
    if (tab === 'income') onFilterChange({ type: 'income', status: 'all' })
    else if (tab === 'expense') onFilterChange({ type: 'expense', status: 'all' })
    else if (tab === 'pending') onFilterChange({ type: 'all', status: 'pending' })
    else if (tab === 'paid') onFilterChange({ type: 'all', status: 'paid' })
    else if (tab === 'overdue') onFilterChange({ type: 'all', status: 'pending' })
    else onFilterChange({ type: 'all', status: 'all' })
  }

  const visibleTransactions = useMemo(() => {
    if (activeTab !== 'overdue') return transactions
    return transactions.filter((transaction) => getOverdueStatus(transaction.due_date, transaction.status) === 'overdue')
  }, [transactions, activeTab])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium text-neutral-900">
          Transações <span className="ml-1 font-normal text-neutral-400">{visibleTransactions.length}</span>
        </h3>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-lg border border-neutral-200 bg-white p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => handleTabChange(tab.key)}
            className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
              activeTab === tab.key ? 'bg-purple-50 text-purple-700' : 'text-neutral-500 hover:bg-neutral-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <TransactionFilters
        filters={filters}
        onChange={onFilterChange}
        onClear={onClearFilters}
        hasActiveFilters={hasActiveFilters}
        categories={categories}
      />

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        {!loading && !error && visibleTransactions.length === 0 ? (
          <EmptyState
            title="Nenhuma transação encontrada"
            action={<Button size="sm" onClick={onCreateTransaction}>Registrar transação</Button>}
          />
        ) : error ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 text-neutral-500">
                    <th className="px-4 py-3 font-medium">Descrição</th>
                    <th className="px-4 py-3 font-medium">Categoria</th>
                    <th className="px-4 py-3 font-medium">Vinculado</th>
                    <th className="px-4 py-3 font-medium">Método</th>
                    <th className="px-4 py-3 text-right font-medium">Valor</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Data</th>
                    <th className="px-4 py-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <SkeletonRows />
                  ) : (
                    visibleTransactions.map((transaction) => {
                      const overdue = getOverdueStatus(transaction.due_date, transaction.status) === 'overdue'
                      const displayStatus = overdue ? 'overdue' : transaction.status

                      return (
                        <tr
                          key={transaction.id}
                          className={`group border-b border-neutral-100 transition-colors duration-150 last:border-0 hover:bg-purple-50/60 ${
                            overdue ? 'border-l-2 border-l-red-500' : ''
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className={transaction.type === 'income' ? 'text-emerald-600' : 'text-red-500'}>
                                {transaction.type === 'income' ? '↑' : '↓'}
                              </span>
                              <button
                                type="button"
                                onClick={() => onEdit(transaction)}
                                className="text-left font-medium text-neutral-900 hover:text-purple-700"
                              >
                                {transaction.description}
                              </button>
                              {transaction.recurrence !== 'none' && (
                                <Tooltip content={`Recorrência ${RECURRENCE_LABELS[transaction.recurrence].toLowerCase()}`}>
                                  <span className="text-xs text-neutral-400">↻</span>
                                </Tooltip>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <CategoryBadge category={transaction.category} />
                          </td>
                          <td className="px-4 py-3">
                            {transaction.contact && (
                              <Link to={`/crm/${transaction.contact.id}`} className="text-xs text-purple-600 hover:text-purple-700">
                                {transaction.contact.name}
                              </Link>
                            )}
                            {transaction.deal && (
                              <Link to={`/deals/${transaction.deal.id}`} className="block text-xs text-purple-600 hover:text-purple-700">
                                {transaction.deal.title}
                              </Link>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-neutral-500">
                            {transaction.payment_method ? PAYMENT_METHOD_LABELS[transaction.payment_method] : '—'}
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-medium ${
                              transaction.type === 'income' ? 'text-emerald-600' : 'text-red-500'
                            }`}
                          >
                            {transaction.type === 'income' ? '+' : '-'}
                            {formatCurrency(transaction.amount)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClasses[displayStatus]}`}>
                              {overdue ? 'Vencido' : TRANSACTION_STATUS_LABELS[transaction.status]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-neutral-500">{formatDate(transaction.date)}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                              {transaction.status === 'pending' && (
                                <button
                                  type="button"
                                  onClick={() => onMarkAsPaid(transaction.id)}
                                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                                >
                                  Marcar pago
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => onEdit(transaction)}
                                className="text-xs font-medium text-neutral-500 hover:text-purple-700"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteRequest(transaction)}
                                className="text-xs font-medium text-neutral-500 hover:text-red-600"
                              >
                                Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 p-3 md:hidden">
              {loading
                ? Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28 w-full" />)
                : visibleTransactions.map((transaction) => (
                    <TransactionCard
                      key={transaction.id}
                      transaction={transaction}
                      onEdit={() => onEdit(transaction)}
                      onMarkAsPaid={() => onMarkAsPaid(transaction.id)}
                      onDelete={() => onDeleteRequest(transaction)}
                    />
                  ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
