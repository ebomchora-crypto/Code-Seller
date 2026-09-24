import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { ReceivableCard } from '@/components/financial/ReceivableCard'
import { MarkAsPaidModal } from '@/components/financial/MarkAsPaidModal'
import { formatCurrency } from '@/utils/financial'
import type { PaymentMethod, Receivable } from '@/types'

interface ReceivablesListProps {
  receivables: Receivable[]
  loading: boolean
  error?: string | null
  onRetry?: () => void
  onMarkAsPaid: (id: string, paymentMethod: PaymentMethod, paidAt?: string, notes?: string) => Promise<boolean>
  onUpdateDueDate: (id: string, due_date: string) => Promise<void>
  onCancel: (id: string) => Promise<void>
}

type QuickTab = 'all' | 'pending' | 'overdue' | 'paid'

const TABS: { key: QuickTab; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'pending', label: 'Pendentes' },
  { key: 'overdue', label: 'Vencidas' },
  { key: 'paid', label: 'Pagas' },
]

function isOverdue(receivable: Receivable): boolean {
  if (receivable.status !== 'pending' || !receivable.due_date) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(`${receivable.due_date}T00:00:00`) < today
}

export function ReceivablesList({
  receivables,
  loading,
  error,
  onRetry,
  onMarkAsPaid,
  onUpdateDueDate,
  onCancel,
}: ReceivablesListProps) {
  const [activeTab, setActiveTab] = useState<QuickTab>('all')
  const [payingReceivable, setPayingReceivable] = useState<Receivable | null>(null)

  const filtered = useMemo(() => {
    if (activeTab === 'all') return receivables
    if (activeTab === 'pending') return receivables.filter((r) => r.status === 'pending' && !isOverdue(r))
    if (activeTab === 'overdue') return receivables.filter(isOverdue)
    return receivables.filter((r) => r.status === 'paid')
  }, [receivables, activeTab])

  const total = useMemo(
    () => receivables.filter((r) => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0),
    [receivables],
  )

  async function handleConfirmPayment(paymentMethod: PaymentMethod, paidAt: string, notes: string) {
    if (!payingReceivable) return
    const success = await onMarkAsPaid(payingReceivable.id, paymentMethod, paidAt, notes)
    if (success) setPayingReceivable(null)
  }

  return (
    <Card>
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-base font-medium text-neutral-900">Contas a Receber</h3>
        <span className="text-sm font-medium text-amber-600">{formatCurrency(total)}</span>
      </div>

      <div className="mt-3 flex gap-1 overflow-x-auto rounded-lg bg-neutral-50 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
              activeTab === tab.key ? 'bg-white text-purple-700 shadow-sm' : 'text-neutral-500'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-24 w-full" />)
        ) : error ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : filtered.length === 0 ? (
          <EmptyState title="Nenhuma conta a receber encontrada" />
        ) : (
          filtered.map((receivable) => (
            <ReceivableCard
              key={receivable.id}
              receivable={receivable}
              onMarkAsPaid={() => setPayingReceivable(receivable)}
              onUpdateDueDate={(due_date) => void onUpdateDueDate(receivable.id, due_date)}
              onCancel={() => void onCancel(receivable.id)}
            />
          ))
        )}
      </div>

      <MarkAsPaidModal
        receivable={payingReceivable}
        onClose={() => setPayingReceivable(null)}
        onConfirm={handleConfirmPayment}
      />
    </Card>
  )
}
