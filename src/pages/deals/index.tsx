import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageWrapper } from '@/components/ui/PageWrapper'
import { SectionLabel } from '@/components/ui/section-label'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ErrorState } from '@/components/ui/ErrorState'
import { DealFilters } from '@/components/deals/DealFilters'
import { DealList } from '@/components/deals/DealList'
import { DealPipeline } from '@/components/deals/DealPipeline'
import { DealForm } from '@/components/deals/DealForm'
import { PipelineMetrics } from '@/components/deals/PipelineMetrics'
import { useDeals } from '@/hooks/useDeals'
import type { Deal } from '@/types'

function PipelineIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      className={`h-4 w-4 ${active ? 'text-purple-600' : 'text-neutral-400'}`}
    >
      <rect x="3" y="4" width="5" height="16" rx="1" />
      <rect x="9.5" y="4" width="5" height="10" rx="1" />
      <rect x="16" y="4" width="5" height="13" rx="1" />
    </svg>
  )
}

function ListIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      className={`h-4 w-4 ${active ? 'text-purple-600' : 'text-neutral-400'}`}
    >
      <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

export default function DealsPage() {
  const { deals, metrics, loading, error, filters, setFilters, clearFilters, hasActiveFilters, view, setView, refetch, deleteDeal, updateStage } =
    useDeals()

  const [searchParams, setSearchParams] = useSearchParams()
  const [formOpen, setFormOpen] = useState(false)
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null)
  const [deletingDeal, setDeletingDeal] = useState<Deal | null>(null)
  const [deleting, setDeleting] = useState(false)

  const presetContactId = searchParams.get('newForContact') ?? undefined
  const presetContactName = searchParams.get('newForContactName') ?? undefined

  useEffect(() => {
    if (presetContactId) {
      setEditingDeal(null)
      setFormOpen(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetContactId])

  function openCreateForm() {
    setEditingDeal(null)
    setFormOpen(true)
  }

  function openEditForm(deal: Deal) {
    setEditingDeal(deal)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    if (presetContactId) {
      searchParams.delete('newForContact')
      searchParams.delete('newForContactName')
      setSearchParams(searchParams, { replace: true })
    }
  }

  async function handleConfirmDelete() {
    if (!deletingDeal) return
    setDeleting(true)
    await deleteDeal(deletingDeal.id)
    setDeleting(false)
    setDeletingDeal(null)
  }

  const activeDealsCount = deals.filter((deal) => deal.status === 'open').length

  return (
    <PageWrapper>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <SectionLabel>Negócios</SectionLabel>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-[var(--text-primary)]">
              {view === 'pipeline' ? 'Pipeline' : 'Negócios'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white p-1">
              <button
                type="button"
                aria-label="Visualização em pipeline"
                aria-pressed={view === 'pipeline'}
                onClick={() => setView('pipeline')}
                className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${view === 'pipeline' ? 'bg-purple-50' : 'hover:bg-neutral-50'}`}
              >
                <PipelineIcon active={view === 'pipeline'} />
              </button>
              <button
                type="button"
                aria-label="Visualização em lista"
                aria-pressed={view === 'list'}
                onClick={() => setView('list')}
                className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${view === 'list' ? 'bg-purple-50' : 'hover:bg-neutral-50'}`}
              >
                <ListIcon active={view === 'list'} />
              </button>
            </div>

            <Button magnetic onClick={openCreateForm}>+ Novo Negócio</Button>
          </div>
        </div>

        <div className="mt-6">
          <PipelineMetrics metrics={metrics} activeDealsCount={activeDealsCount} />
        </div>

        <div className="mt-6">
          <DealFilters
            filters={filters}
            onChange={setFilters}
            onClear={clearFilters}
            hasActiveFilters={hasActiveFilters}
            resultCount={deals.length}
            loading={loading}
          />
        </div>

        <div className="mt-6">
          {error ? (
            <ErrorState message={error} onRetry={refetch} />
          ) : view === 'list' ? (
            <DealList deals={deals} loading={loading} onEdit={openEditForm} onDeleteRequest={setDeletingDeal} />
          ) : (
            <DealPipeline deals={deals} loading={loading} onStageChange={updateStage} />
          )}
        </div>

        <Drawer open={formOpen} onClose={closeForm} title={editingDeal ? 'Editar negócio' : 'Novo negócio'}>
          <DealForm
            deal={editingDeal ?? undefined}
            defaultContactId={editingDeal ? undefined : presetContactId}
            defaultContactName={editingDeal ? undefined : presetContactName}
            onCancel={closeForm}
            onSuccess={() => {
              closeForm()
              void refetch()
            }}
          />
        </Drawer>

        <ConfirmDialog
          open={deletingDeal !== null}
          title="Excluir negócio"
          message={`Tem certeza que deseja excluir "${deletingDeal?.title}"? Essa ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          loading={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingDeal(null)}
        />
    </PageWrapper>
  )
}
