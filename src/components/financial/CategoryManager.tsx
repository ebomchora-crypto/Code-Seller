import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { useFinancialCategories } from '@/hooks/useFinancialCategories'
import { CATEGORY_COLOR_SWATCHES } from '@/types'
import type { FinancialCategory, TransactionType } from '@/types'

interface CategoryManagerProps {
  open: boolean
  onClose: () => void
}

export function CategoryManager({ open, onClose }: CategoryManagerProps) {
  const { incomeCategories, expenseCategories, loading, createCategory, deleteCategory } = useFinancialCategories()
  const [activeTab, setActiveTab] = useState<TransactionType>('income')
  const [name, setName] = useState('')
  const [color, setColor] = useState(CATEGORY_COLOR_SWATCHES[0])
  const [creating, setCreating] = useState(false)
  const [deletingCategory, setDeletingCategory] = useState<FinancialCategory | null>(null)
  const [deleting, setDeleting] = useState(false)

  const categories = activeTab === 'income' ? incomeCategories : expenseCategories

  async function handleCreate() {
    if (!name.trim()) return
    setCreating(true)
    const category = await createCategory(name.trim(), activeTab, color)
    setCreating(false)
    if (category) setName('')
  }

  async function handleConfirmDelete() {
    if (!deletingCategory) return
    setDeleting(true)
    await deleteCategory(deletingCategory.id)
    setDeleting(false)
    setDeletingCategory(null)
  }

  return (
    <Modal open={open} onClose={onClose} title="Categorias" size="md">
      <div className="grid grid-cols-2 gap-1 rounded-xl border border-[var(--border-default)] bg-[var(--field-bg)] p-1">
        <button
          type="button"
          onClick={() => setActiveTab('income')}
          className={`rounded-lg py-2 text-sm font-medium transition-colors duration-150 ${
            activeTab === 'income' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          Receitas
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('expense')}
          className={`rounded-lg py-2 text-sm font-medium transition-colors duration-150 ${
            activeTab === 'expense' ? 'bg-red-500/15 text-red-600 dark:text-red-400' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          Despesas
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-10 w-full" />)
        ) : categories.length === 0 ? (
          <EmptyState title="Nenhuma categoria cadastrada" />
        ) : (
          categories.map((category) => (
            <div key={category.id} className="flex items-center justify-between rounded-xl border border-[var(--border-default)] px-3 py-2">
              <span className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: category.color }} />
                {category.name}
              </span>
              <button
                type="button"
                onClick={() => setDeletingCategory(category)}
                className="text-xs font-medium text-[var(--text-muted)] hover:text-red-500"
              >
                Remover
              </button>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-[var(--border-subtle)] pt-4">
        <Input
          label="Nova categoria"
          placeholder={activeTab === 'income' ? 'Ex: Consultoria' : 'Ex: Marketing'}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <div className="flex gap-1.5">
          {CATEGORY_COLOR_SWATCHES.map((swatch) => (
            <button
              key={swatch}
              type="button"
              aria-label={`Cor ${swatch}`}
              onClick={() => setColor(swatch)}
              className={`h-6 w-6 rounded-full ${color === swatch ? 'ring-2 ring-offset-1' : ''}`}
              style={{ backgroundColor: swatch }}
            />
          ))}
        </div>
        <div className="flex justify-end">
          <Button size="sm" onClick={handleCreate} loading={creating}>
            Adicionar categoria
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={deletingCategory !== null}
        title="Remover categoria"
        message={`Tem certeza que deseja remover "${deletingCategory?.name}"? Transações vinculadas a ela ficarão sem categoria.`}
        confirmLabel="Remover"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingCategory(null)}
      />
    </Modal>
  )
}
