import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence } from 'motion/react'
import { FlipItem } from '@/components/motion/FlipItem'
import { CategoryBadge } from '@/components/financial/CategoryBadge'
import { TransactionFilters } from '@/components/financial/TransactionFilters'
import { TransactionCard } from '@/components/financial/TransactionCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PanelHeader } from '@/components/ui/PanelHeader'
import { FilterChips } from '@/components/ui/FilterChips'
import { StatusPill } from '@/components/financial/StatusPill'
import { ArrowDownRight, ArrowUpRight, CheckCircle2, Pencil, Repeat, Trash2 } from 'lucide-react'
import { formatCurrency, getOverdueStatus, PAYMENT_METHOD_LABELS, RECURRENCE_LABELS } from '@/utils/financial'
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

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
}

const iconButton =
  'flex size-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-muted)]'

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
    return transactions.filter(
      (transaction) => getOverdueStatus(transaction.due_date, transaction.status) === 'overdue',
    )
  }, [transactions, activeTab])

  return (
    <Card className="h-full">
      <PanelHeader
        title="Transações"
        subtitle={`${visibleTransactions.length} ${visibleTransactions.length === 1 ? 'lançamento' : 'lançamentos'}`}
      />

      <div className="flex flex-col gap-3">
        <FilterChips
          label="Filtrar transações"
          options={TABS.map((tab) => ({ value: tab.key, label: tab.label }))}
          value={activeTab}
          onChange={handleTabChange}
        />
        <TransactionFilters
          filters={filters}
          onChange={onFilterChange}
          onClear={onClearFilters}
          hasActiveFilters={hasActiveFilters}
          categories={categories}
        />
      </div>

      <div className="-mx-6 mt-4 border-t border-[var(--border-subtle)]">
        {!loading && !error && visibleTransactions.length === 0 ? (
          <div className="px-6 pt-6">
            <EmptyState
              title="Nenhuma transação encontrada"
              action={
                <Button size="sm" className="h-9 rounded-full px-4" onClick={onCreateTransaction}>
                  Registrar transação
                </Button>
              }
            />
          </div>
        ) : error ? (
          <div className="px-6 pt-6">
            <ErrorState message={error} onRetry={onRetry} />
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-[13.5px]">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-[11.5px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    <th className="py-3 pl-6 pr-4 font-semibold">Descrição</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Valor</th>
                    <th className="w-32 py-3 pl-2 pr-5">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, index) => (
                      <tr key={index} className="border-b border-[var(--border-subtle)] last:border-0">
                        {Array.from({ length: 4 }).map((_column, columnIndex) => (
                          <td key={columnIndex} className="px-4 py-4 first:pl-6">
                            <Skeleton className="h-4 w-full max-w-[120px]" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <AnimatePresence initial={false}>
                      {visibleTransactions.map((transaction) => {
                        const overdue = getOverdueStatus(transaction.due_date, transaction.status) === 'overdue'
                        const income = transaction.type === 'income'
                        return (
                          <FlipItem
                            as="tr"
                            key={transaction.id}
                            className="group border-b border-[var(--border-subtle)] transition-colors duration-150 last:border-0 hover:bg-black/[0.025] dark:hover:bg-white/[0.03]"
                          >
                            <td className="py-3 pl-6 pr-4">
                              <div className="flex min-w-0 items-center gap-3">
                                <span
                                  className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
                                    income ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                                  }`}
                                >
                                  {income ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
                                </span>
                                <div className="min-w-0">
                                  <button
                                    type="button"
                                    onClick={() => onEdit(transaction)}
                                    className="flex max-w-[280px] items-center gap-1.5 truncate text-left font-medium text-[var(--text-primary)] hover:text-[var(--accent-text)]"
                                  >
                                    <span className="truncate">{transaction.description}</span>
                                    {transaction.recurrence !== 'none' && (
                                      <span
                                        title={`Recorrência ${RECURRENCE_LABELS[transaction.recurrence].toLowerCase()}`}
                                      >
                                        <Repeat className="size-3.5 shrink-0 text-[var(--text-muted)]" />
                                      </span>
                                    )}
                                  </button>
                                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[var(--text-muted)]">
                                    <span className="tabular-nums">{formatDate(transaction.date)}</span>
                                    <CategoryBadge category={transaction.category} />
                                    {transaction.payment_method && (
                                      <span>{PAYMENT_METHOD_LABELS[transaction.payment_method]}</span>
                                    )}
                                    {transaction.contact && (
                                      <Link
                                        to={`/crm/${transaction.contact.id}`}
                                        className="hover:text-[var(--accent-text)]"
                                      >
                                        {transaction.contact.name}
                                      </Link>
                                    )}
                                    {transaction.deal && (
                                      <Link
                                        to={`/deals/${transaction.deal.id}`}
                                        className="hover:text-[var(--accent-text)]"
                                      >
                                        {transaction.deal.title}
                                      </Link>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <StatusPill status={overdue ? 'overdue' : transaction.status} />
                            </td>
                            <td
                              className={`whitespace-nowrap px-4 py-3 text-right font-display font-semibold tabular-nums ${
                                income ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--text-primary)]'
                              }`}
                            >
                              {income ? '+' : '−'}
                              {formatCurrency(transaction.amount)}
                            </td>
                            <td className="py-3 pl-2 pr-5">
                              <div className="flex justify-end gap-0.5 opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover:opacity-100">
                                {transaction.status === 'pending' && (
                                  <button
                                    type="button"
                                    onClick={() => onMarkAsPaid(transaction.id)}
                                    aria-label={`Marcar ${transaction.description} como pago`}
                                    title="Marcar como pago"
                                    className={`${iconButton} hover:text-emerald-500`}
                                  >
                                    <CheckCircle2 className="size-4" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => onEdit(transaction)}
                                  aria-label={`Editar ${transaction.description}`}
                                  title="Editar"
                                  className={`${iconButton} hover:text-[var(--accent-text)]`}
                                >
                                  <Pencil className="size-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDeleteRequest(transaction)}
                                  aria-label={`Excluir ${transaction.description}`}
                                  title="Excluir"
                                  className={`${iconButton} hover:text-red-500`}
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              </div>
                            </td>
                          </FlipItem>
                        )
                      })}
                    </AnimatePresence>
                  )}
                </tbody>
              </table>
            </div>

            <ul className="flex flex-col divide-y divide-[var(--border-subtle)] md:hidden">
              {loading
                ? Array.from({ length: 4 }).map((_, index) => (
                    <li key={index} className="px-6 py-4">
                      <Skeleton className="h-12 w-full" />
                    </li>
                  ))
                : visibleTransactions.map((transaction) => (
                    <li key={transaction.id}>
                      <TransactionCard
                        transaction={transaction}
                        onEdit={() => onEdit(transaction)}
                        onMarkAsPaid={() => onMarkAsPaid(transaction.id)}
                        onDelete={() => onDeleteRequest(transaction)}
                      />
                    </li>
                  ))}
            </ul>
          </>
        )}
      </div>
    </Card>
  )
}
