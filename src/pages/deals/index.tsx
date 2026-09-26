import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Briefcase, Columns3, List, Plus } from 'lucide-react'
import { PageHeader, PageWrapper } from '@/components/ui/PageWrapper'
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
        <PageHeader
          title="Negócios"
          count={deals.length}
          subtitle="Cada proposta em andamento, da primeira conversa ao fechamento."
          actions={
            <>
              <div
                role="group"
                aria-label="Modo de visualização"
                className="flex h-11 items-center gap-1 rounded-full border border-[var(--border-default)] bg-[var(--bg-card)] p-1"
              >
                {(
                  [
                    { value: 'pipeline', label: 'Pipeline', icon: Columns3 },
                    { value: 'list', label: 'Lista', icon: List },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={view === option.value}
                    onClick={() => setView(option.value)}
                    className={`flex h-full items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-colors ${
                      view === option.value
                        ? 'bg-[var(--accent-tint)] text-[var(--accent-text)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <option.icon className="size-4" />
                    {option.label}
                  </button>
                ))}
              </div>

              <Button magnetic className="h-11 rounded-full px-5" onClick={openCreateForm}>
                <Plus className="size-4" strokeWidth={2.4} />
                Novo negócio
              </Button>
            </>
          }
        />

        <div className="mt-8">
          <PipelineMetrics metrics={metrics} activeDealsCount={activeDealsCount} />
        </div>

        <div className="mt-8">
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
          ) : !loading && deals.length === 0 && !hasActiveFilters ? (
            <div className="flex flex-col items-center rounded-[var(--card-radius)] border border-dashed border-[var(--border-default)] px-6 py-16 text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-[var(--accent-tint)] text-[var(--accent-text)]">
                <Briefcase className="size-6" />
              </span>
              <h2 className="mt-5 font-display text-[20px] font-semibold tracking-tight text-[var(--text-primary)]">
                Nenhum negócio ainda
              </h2>
              <p className="mt-2 max-w-md text-[14px] leading-relaxed text-[var(--text-muted)]">
                Crie um negócio para cada proposta que você está negociando e acompanhe tudo pelo pipeline, etapa por etapa.
              </p>
              <Button className="mt-6 h-11 rounded-full px-5" onClick={openCreateForm}>
                <Plus className="size-4" strokeWidth={2.4} />
                Novo negócio
              </Button>
            </div>
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
