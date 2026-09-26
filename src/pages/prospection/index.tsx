import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Crosshair, Gauge, Loader2, Plus, SearchX, UserPlus, X } from 'lucide-react'
import { PageHeader, PageWrapper } from '@/components/ui/PageWrapper'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { HunterSearchPanel } from '@/components/prospection/HunterSearchPanel'
import { ProspectFiltersPanel } from '@/components/prospection/ProspectFiltersPanel'
import { ProspectCard } from '@/components/prospection/ProspectCard'
import { OutreachModal } from '@/components/prospection/OutreachModal'
import { useProspection } from '@/hooks/useProspection'
import { countActiveProspectFilters } from '@/utils/prospection'
import type { ProspectFilters, ScoredProspect } from '@/types'

const SORT_OPTIONS: { value: ProspectFilters['sort']; label: string }[] = [
  { value: 'potential', label: 'Maior potencial' },
  { value: 'reviews', label: 'Mais avaliações' },
  { value: 'rating', label: 'Melhor nota' },
  { value: 'name', label: 'Nome (A–Z)' },
]

const STEPS = [
  {
    icon: Crosshair,
    title: 'Mire no nicho e na cidade',
    text: 'Diga o tipo de empresa e onde ela fica. O Buyers Hunter varre a região atrás de negócios ativos.',
  },
  {
    icon: Gauge,
    title: 'Veja o potencial de cada uma',
    text: 'Cada empresa ganha uma nota de 0 a 100 com os motivos à mostra: sem site, movimento, nota, contato.',
  },
  {
    icon: UserPlus,
    title: 'Leve para o CRM e aborde',
    text: 'Adicione ao CRM com um clique e gere a primeira mensagem com o CS Copilot, pronta para o WhatsApp.',
  },
]

function ResultsSkeleton() {
  return (
    <div>
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 border-b border-[var(--border-subtle)] px-5 py-5 last:border-0">
          <Skeleton className="size-12 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="mt-2 h-3 w-64" />
            <Skeleton className="mt-3 h-3 w-40" />
          </div>
          <Skeleton className="hidden h-9 w-40 rounded-xl sm:block" />
        </div>
      ))}
    </div>
  )
}

export default function ProspectionPage() {
  const hunter = useProspection()
  const [outreachFor, setOutreachFor] = useState<ScoredProspect | null>(null)
  const [scanningCity, setScanningCity] = useState<string | null>(null)

  const searching = hunter.status === 'searching'
  const hasResults = hunter.params !== null && hunter.status !== 'searching' && hunter.status !== 'error'
  const highCount = hunter.scored.filter((prospect) => prospect.potential.level === 'high').length
  const selectable = hunter.visible.filter((prospect) => !hunter.imported.has(prospect.id))
  const allSelected = selectable.length > 0 && selectable.every((prospect) => hunter.selected.has(prospect.id))
  const selectedProspects = hunter.scored.filter((prospect) => hunter.selected.has(prospect.id))
  const bulkImporting = selectedProspects.some((prospect) => hunter.importing.has(prospect.id))

  return (
    <PageWrapper>
      <PageHeader
        title="Buyers Hunter"
        subtitle="Encontre empresas com potencial real de compra e leve as melhores direto para o seu CRM."
      />

      <div className="mt-8">
        <HunterSearchPanel
          key={hunter.params ? `${hunter.params.niche}|${hunter.params.city}` : 'empty'}
          initial={hunter.params}
          usage={hunter.usage}
          usageLoading={hunter.usageLoading}
          recent={hunter.recent}
          searching={searching}
          resultCount={hunter.scored.length}
          onSearch={(params) => {
            setScanningCity(params.city)
            void hunter.search(params)
          }}
        />
      </div>

      {hunter.status === 'idle' && (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <Card key={step.title} className="relative">
              <span className="absolute right-5 top-5 font-display text-[13px] font-semibold tabular-nums text-[var(--text-muted)]">
                0{index + 1}
              </span>
              <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--accent-tint)] text-[var(--accent-text)]">
                <step.icon className="size-5" />
              </span>
              <h3 className="mt-4 text-[15px] font-semibold text-[var(--text-primary)]">{step.title}</h3>
              <p className="mt-1.5 text-[13.5px] leading-6 text-[var(--text-muted)]">{step.text}</p>
            </Card>
          ))}
        </div>
      )}

      {hunter.status === 'error' && hunter.error && (
        <Card className="mt-8 flex flex-col items-center gap-3 py-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-[var(--accent-tint)] text-[var(--accent-text)]">
            <SearchX className="size-5" />
          </span>
          <h3 className="text-[16px] font-semibold text-[var(--text-primary)]">
            {hunter.error.code === 'limit_reached' ? 'Limite do mês atingido' : 'A busca não foi concluída'}
          </h3>
          <p className="max-w-md text-[14px] text-[var(--text-muted)]">{hunter.error.message}</p>
        </Card>
      )}

      {(searching || hasResults) && (
        <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr] lg:items-start">
          <div className="lg:sticky lg:top-6">
            <ProspectFiltersPanel filters={hunter.filters} onChange={hunter.setFilters} onReset={hunter.resetFilters} />
          </div>

          <Card className="overflow-hidden !p-0">
            <div className="flex flex-col gap-3 border-b border-[var(--border-subtle)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                {hasResults && selectable.length > 0 && (
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={allSelected}
                    aria-label="Selecionar todas"
                    onClick={hunter.selectAllVisible}
                    className={`flex size-5 items-center justify-center rounded-md border transition-colors ${
                      allSelected
                        ? 'border-transparent bg-[linear-gradient(135deg,#8b5cf6,#6d28d9)] text-white'
                        : 'border-[var(--border-strong)] hover:border-[var(--accent-ring)]'
                    }`}
                  >
                    {allSelected && <Check className="size-3.5" strokeWidth={3} />}
                  </button>
                )}
                <p className="text-[13.5px] text-[var(--text-muted)]">
                  {searching ? (
                    <>
                      Varrendo <span className="font-medium text-[var(--text-primary)]">{scanningCity ?? 'a região'}</span>…
                    </>
                  ) : (
                    <>
                      <span className="font-semibold tabular-nums text-[var(--text-primary)]">{hunter.visible.length}</span>{' '}
                      {hunter.visible.length === 1 ? 'empresa' : 'empresas'}
                      {highCount > 0 && (
                        <>
                          {' · '}
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">{highCount} com potencial alto</span>
                        </>
                      )}
                    </>
                  )}
                </p>
              </div>

              <label className="flex items-center gap-2 text-[13px] text-[var(--text-muted)]">
                Ordenar
                <select
                  value={hunter.filters.sort}
                  onChange={(event) => hunter.setFilters({ sort: event.target.value as ProspectFilters['sort'] })}
                  className="h-9 rounded-xl border border-[var(--border-default)] bg-[var(--field-bg)] px-3 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--accent-ring)]"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {searching ? (
              <ResultsSkeleton />
            ) : hunter.visible.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
                <SearchX className="size-6 text-[var(--text-muted)]" />
                <p className="text-[15px] font-medium text-[var(--text-primary)]">
                  {hunter.scored.length === 0 ? 'Nenhuma empresa encontrada' : 'Nenhuma empresa com esses filtros'}
                </p>
                <p className="max-w-sm text-[13.5px] text-[var(--text-muted)]">
                  {hunter.scored.length === 0
                    ? 'Tente um nicho mais amplo ou uma cidade vizinha.'
                    : 'Afrouxe os filtros ao lado para ver mais empresas.'}
                </p>
                {hunter.scored.length > 0 && countActiveProspectFilters(hunter.filters) > 0 && (
                  <Button variant="secondary" size="sm" className="mt-1 rounded-full" onClick={hunter.resetFilters}>
                    Limpar filtros
                  </Button>
                )}
              </div>
            ) : (
              <div>
                {hunter.visible.map((prospect) => (
                  <ProspectCard
                    key={prospect.id}
                    prospect={prospect}
                    selected={hunter.selected.has(prospect.id)}
                    importedContactId={hunter.imported.get(prospect.id)}
                    importing={hunter.importing.has(prospect.id)}
                    onToggleSelect={() => hunter.toggleSelected(prospect.id)}
                    onImport={() => void hunter.importMany([prospect])}
                    onDismiss={() => void hunter.dismiss(prospect)}
                    onOutreach={() => setOutreachFor(prospect)}
                  />
                ))}
              </div>
            )}

            {hasResults && hunter.nextPageToken && (
              <div className="border-t border-[var(--border-subtle)] px-5 py-4 text-center">
                <Button
                  variant="secondary"
                  className="rounded-full"
                  onClick={() => void hunter.loadMore()}
                  disabled={hunter.status === 'loading_more'}
                >
                  {hunter.status === 'loading_more' && <Loader2 className="size-4 animate-spin" />}
                  Carregar mais empresas
                </Button>
                <p className="mt-2 text-[12px] text-[var(--text-muted)]">Conta como 1 busca do seu limite mensal.</p>
              </div>
            )}
          </Card>
        </div>
      )}

      <AnimatePresence>
        {hunter.selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="fixed inset-x-4 bottom-5 z-40 mx-auto flex max-w-lg items-center justify-between gap-3 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)] py-2.5 pl-5 pr-2.5 shadow-[var(--shadow-modal)]"
          >
            <span className="text-[13.5px] text-[var(--text-secondary)]">
              <span className="font-semibold tabular-nums text-[var(--text-primary)]">{hunter.selected.size}</span>{' '}
              {hunter.selected.size === 1 ? 'selecionada' : 'selecionadas'}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={hunter.clearSelection}
                aria-label="Limpar seleção"
                className="flex size-9 items-center justify-center rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="size-4" />
              </button>
              <Button className="rounded-xl" loading={bulkImporting} onClick={() => void hunter.importMany(selectedProspects)}>
                {!bulkImporting && <Plus className="size-4" strokeWidth={2.4} />}
                Adicionar ao CRM
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {hunter.selected.size > 0 && <div aria-hidden className="h-20" />}

      <OutreachModal prospect={outreachFor} offer={hunter.params?.offer ?? 'site'} onClose={() => setOutreachFor(null)} />
    </PageWrapper>
  )
}
