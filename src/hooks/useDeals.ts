import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  deleteDeal as deleteDealService,
  getDeals,
  updateDealStage as updateDealStageService,
} from '@/services/supabase/deals'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { calculatePipelineMetrics } from '@/utils/deals'
import type { Deal, DealFilters, DealsView, DealStage } from '@/types'

const DEFAULT_FILTERS: DealFilters = {
  search: '',
  stage: 'all',
  status: 'all',
  origin: '',
  service: '',
}

export function useDeals() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<DealFilters>(DEFAULT_FILTERS)
  const [view, setView] = useState<DealsView>('pipeline')

  const debouncedSearch = useDebouncedValue(filters.search, 300)
  const effectiveFilters = useMemo(() => ({ ...filters, search: debouncedSearch }), [filters, debouncedSearch])

  const fetchDeals = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getDeals(effectiveFilters)
      setDeals(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar os negócios.')
    } finally {
      setLoading(false)
    }
  }, [effectiveFilters])

  useEffect(() => {
    void fetchDeals()
  }, [fetchDeals])

  const updateFilters = useCallback((next: Partial<DealFilters>) => {
    setFilters((current) => ({ ...current, ...next }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
  }, [])

  const removeDeal = useCallback(async (id: string) => {
    try {
      await deleteDealService(id)
      setDeals((current) => current.filter((deal) => deal.id !== id))
      toast.success('Negócio excluído com sucesso.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível excluir o negócio.')
    }
  }, [])

  const updateStage = useCallback(
    async (id: string, stage: DealStage) => {
      const previous = deals.find((deal) => deal.id === id)
      if (!previous || previous.stage === stage) return

      const nextStatus = stage === 'won' ? 'won' : stage === 'lost' ? 'lost' : 'open'
      setDeals((current) =>
        current.map((deal) => (deal.id === id ? { ...deal, stage, status: nextStatus } : deal)),
      )

      try {
        await updateDealStageService(id, stage, previous.stage)
      } catch (err) {
        setDeals((current) =>
          current.map((deal) => (deal.id === id ? { ...deal, stage: previous.stage, status: previous.status } : deal)),
        )
        toast.error(err instanceof Error ? err.message : 'Não foi possível atualizar a etapa.')
      }
    },
    [deals],
  )

  const hasActiveFilters =
    filters.search !== '' ||
    filters.stage !== 'all' ||
    filters.status !== 'all' ||
    filters.origin !== '' ||
    filters.service !== ''

  const metrics = useMemo(() => calculatePipelineMetrics(deals), [deals])

  return {
    deals,
    metrics,
    loading,
    error,
    filters,
    setFilters: updateFilters,
    clearFilters,
    hasActiveFilters,
    view,
    setView,
    refetch: fetchDeals,
    deleteDeal: removeDeal,
    updateStage,
  }
}
