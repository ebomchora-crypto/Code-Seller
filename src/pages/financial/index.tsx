import { useState } from 'react'
import { Plus, Tags } from 'lucide-react'
import { PageHeader, PageWrapper } from '@/components/ui/PageWrapper'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { FinancialMetrics } from '@/components/financial/FinancialMetrics'
import { CashFlowChart } from '@/components/financial/CashFlowChart'
import { TransactionList } from '@/components/financial/TransactionList'
import { TransactionForm } from '@/components/financial/TransactionForm'
import { ReceivablesList } from '@/components/financial/ReceivablesList'
import { CategoryManager } from '@/components/financial/CategoryManager'
import { ExportButton } from '@/components/financial/ExportButton'
import { useFinancial } from '@/hooks/useFinancial'
import { useReceivables } from '@/hooks/useReceivables'
import { useFinancialCategories } from '@/hooks/useFinancialCategories'
import type { Transaction } from '@/types'

export default function FinancialPage() {
  const {
    transactions,
    metrics,
    cashFlow,
    loading,
    error,
    filters,
    setFilters,
    clearFilters,
    hasActiveFilters,
    refetch,
    markAsPaid,
    deleteTransaction,
    exportCSV,
  } = useFinancial()

  const {
    receivables,
    loading: receivablesLoading,
    error: receivablesError,
    refetch: refetchReceivables,
    markAsPaid: markReceivableAsPaid,
    cancelReceivable,
    updateDueDate,
  } = useReceivables()

  const { categories } = useFinancialCategories()

  const [formOpen, setFormOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false)

  function openCreateForm() {
    setEditingTransaction(null)
    setFormOpen(true)
  }

  function openEditForm(transaction: Transaction) {
    setEditingTransaction(transaction)
    setFormOpen(true)
  }

  async function handleConfirmDelete() {
    if (!deletingTransaction) return
    setDeleting(true)
    await deleteTransaction(deletingTransaction.id)
    setDeleting(false)
    setDeletingTransaction(null)
  }

  async function handleReceivablePaid(id: string, paymentMethod: Parameters<typeof markReceivableAsPaid>[1], paidAt?: string, notes?: string) {
    const success = await markReceivableAsPaid(id, paymentMethod, paidAt, notes)
    if (success) void refetch()
    return success
  }

  return (
    <PageWrapper>
        <PageHeader
          title="Financeiro"
          subtitle="O que entrou, o que saiu e o que ainda vai entrar."
          actions={
            <>
              <ExportButton onExport={exportCSV} />
              <Button variant="secondary" className="h-11 rounded-full px-4" onClick={() => setCategoryManagerOpen(true)}>
                <Tags className="size-4" />
                Categorias
              </Button>
              <Button className="h-11 rounded-full px-5" onClick={openCreateForm}>
                <Plus className="size-4" strokeWidth={2.4} />
                Nova transação
              </Button>
            </>
          }
        />

        <div className="mt-8">
          <FinancialMetrics metrics={metrics} loading={loading && !metrics} />
        </div>

        <div className="mt-6">
          <CashFlowChart data={cashFlow} loading={loading && cashFlow.length === 0} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <TransactionList
              transactions={transactions}
              loading={loading}
              error={error}
              onRetry={refetch}
              categories={categories}
              filters={filters}
              onFilterChange={setFilters}
              onClearFilters={clearFilters}
              hasActiveFilters={hasActiveFilters}
              onEdit={openEditForm}
              onMarkAsPaid={markAsPaid}
              onDeleteRequest={setDeletingTransaction}
              onCreateTransaction={openCreateForm}
            />
          </div>
          <div>
            <ReceivablesList
              receivables={receivables}
              loading={receivablesLoading}
              error={receivablesError}
              onRetry={refetchReceivables}
              onMarkAsPaid={handleReceivablePaid}
              onUpdateDueDate={updateDueDate}
              onCancel={cancelReceivable}
            />
          </div>
        </div>

        <Drawer
          open={formOpen}
          onClose={() => setFormOpen(false)}
          title={editingTransaction ? 'Editar transação' : 'Nova transação'}
        >
          <TransactionForm
            transaction={editingTransaction ?? undefined}
            onCancel={() => setFormOpen(false)}
            onSuccess={() => {
              setFormOpen(false)
              void refetch()
            }}
          />
        </Drawer>

        <CategoryManager open={categoryManagerOpen} onClose={() => setCategoryManagerOpen(false)} />

        <ConfirmDialog
          open={deletingTransaction !== null}
          title="Excluir transação"
          message={`Tem certeza que deseja excluir "${deletingTransaction?.description}"? Essa ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          loading={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingTransaction(null)}
        />
    </PageWrapper>
  )
}
