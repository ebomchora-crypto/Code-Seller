import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  dismissProspect,
  getDismissedIds,
  getImportedContacts,
  getProspectUsage,
  getRecentSearches,
  importProspects,
  ProspectError,
  restoreProspect,
  searchProspects,
} from '@/services/supabase/prospection'
import { applyProspectFilters, DEFAULT_PROSPECT_FILTERS, scoreProspect } from '@/utils/prospection'
import type {
  Prospect,
  ProspectFilters,
  ProspectSearchParams,
  ProspectUsage,
  RecentProspectSearch,
  ScoredProspect,
} from '@/types'

type SearchStatus = 'idle' | 'searching' | 'loading_more' | 'done' | 'error'

interface StoredSearch {
  params: ProspectSearchParams
  results: Prospect[]
  nextPageToken: string | null
}

// A última busca fica só na aba (sessionStorage): voltar para a tela não gasta
// outra busca, e nada dos resultados é gravado no banco.
const SESSION_KEY = 'code-sellers-buyers-hunter'

function readStoredSearch(): StoredSearch | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as StoredSearch) : null
  } catch {
    return null
  }
}

function storeSearch(search: StoredSearch) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(search))
  } catch {
    // Armazenamento indisponível: a busca só vale enquanto a tela estiver aberta.
  }
}

export function useProspection() {
  const stored = useMemo(readStoredSearch, [])
  const [usage, setUsage] = useState<ProspectUsage | null>(null)
  const [usageLoading, setUsageLoading] = useState(true)
  const [params, setParams] = useState<ProspectSearchParams | null>(stored?.params ?? null)
  const [results, setResults] = useState<Prospect[]>(stored?.results ?? [])
  const [nextPageToken, setNextPageToken] = useState<string | null>(stored?.nextPageToken ?? null)
  const [status, setStatus] = useState<SearchStatus>(stored ? 'done' : 'idle')
  const [error, setError] = useState<ProspectError | null>(null)
  const [recent, setRecent] = useState<RecentProspectSearch[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [imported, setImported] = useState<Map<string, string>>(new Map())
  const [importing, setImporting] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [filters, setFiltersState] = useState<ProspectFilters>(DEFAULT_PROSPECT_FILTERS)

  const refreshUsage = useCallback(() => {
    setUsageLoading(true)
    getProspectUsage()
      .then(setUsage)
      .catch((reason: unknown) => {
        const code = reason instanceof ProspectError ? reason.code : 'internal'
        setUsage({ configured: code !== 'not_configured', used: 0, limit: 0 })
      })
      .finally(() => setUsageLoading(false))
  }, [])

  const refreshRecent = useCallback(() => {
    getRecentSearches()
      .then(setRecent)
      .catch(() => setRecent([]))
  }, [])

  useEffect(() => {
    refreshUsage()
    refreshRecent()
    getDismissedIds()
      .then(setDismissed)
      .catch(() => setDismissed(new Set()))
  }, [refreshUsage, refreshRecent])

  const syncImported = useCallback((prospects: Prospect[]) => {
    getImportedContacts(prospects.map((prospect) => prospect.id))
      .then((found) => setImported((current) => new Map([...current, ...found])))
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    if (stored) syncImported(stored.results)
  }, [stored, syncImported])

  const search = useCallback(
    async (next: ProspectSearchParams) => {
      setStatus('searching')
      setError(null)
      setSelected(new Set())
      try {
        const response = await searchProspects(next)
        setParams(next)
        setResults(response.results)
        setNextPageToken(response.nextPageToken)
        setUsage(response.usage)
        setStatus('done')
        storeSearch({ params: next, results: response.results, nextPageToken: response.nextPageToken })
        syncImported(response.results)
        refreshRecent()
      } catch (reason) {
        setError(reason instanceof ProspectError ? reason : new ProspectError('internal', 'Erro inesperado na busca.'))
        setStatus('error')
        if (reason instanceof ProspectError && reason.code === 'limit_reached') refreshUsage()
      }
    },
    [refreshRecent, refreshUsage, syncImported],
  )

  const loadMore = useCallback(async () => {
    if (!params || !nextPageToken) return
    setStatus('loading_more')
    try {
      const response = await searchProspects(params, nextPageToken)
      const known = new Set(results.map((prospect) => prospect.id))
      const merged = [...results, ...response.results.filter((prospect) => !known.has(prospect.id))]
      setResults(merged)
      setNextPageToken(response.nextPageToken)
      setUsage(response.usage)
      storeSearch({ params, results: merged, nextPageToken: response.nextPageToken })
      syncImported(response.results)
    } catch (reason) {
      toast.error(reason instanceof ProspectError ? reason.message : 'Não foi possível carregar mais empresas.')
    } finally {
      setStatus('done')
    }
  }, [params, nextPageToken, results, syncImported])

  const dismiss = useCallback(async (prospect: Prospect) => {
    setDismissed((current) => new Set(current).add(prospect.id))
    setSelected((current) => {
      const next = new Set(current)
      next.delete(prospect.id)
      return next
    })
    try {
      await dismissProspect(prospect.id)
      toast(`${prospect.name} não vai mais aparecer nas buscas.`, {
        action: {
          label: 'Desfazer',
          onClick: () => {
            setDismissed((current) => {
              const next = new Set(current)
              next.delete(prospect.id)
              return next
            })
            void restoreProspect(prospect.id)
          },
        },
      })
    } catch {
      setDismissed((current) => {
        const next = new Set(current)
        next.delete(prospect.id)
        return next
      })
      toast.error('Não foi possível ignorar esta empresa.')
    }
  }, [])

  const importMany = useCallback(
    async (prospects: Prospect[]) => {
      const pending = prospects.filter((prospect) => !imported.has(prospect.id))
      if (pending.length === 0) return
      const ids = pending.map((prospect) => prospect.id)
      setImporting((current) => new Set([...current, ...ids]))
      try {
        const created = await importProspects(pending, params?.niche ?? '')
        setImported((current) => new Map([...current, ...created]))
        setSelected((current) => new Set([...current].filter((id) => !created.has(id))))
        toast.success(
          pending.length === 1
            ? `${pending[0].name} foi adicionada ao CRM.`
            : `${pending.length} empresas adicionadas ao CRM.`,
        )
      } catch {
        toast.error('Não foi possível adicionar ao CRM. Tente de novo.')
      } finally {
        setImporting((current) => new Set([...current].filter((id) => !ids.includes(id))))
      }
    },
    [imported, params],
  )

  const toggleSelected = useCallback((id: string) => {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const setFilters = useCallback((next: Partial<ProspectFilters>) => {
    setFiltersState((current) => ({ ...current, ...next }))
  }, [])

  const resetFilters = useCallback(() => setFiltersState(DEFAULT_PROSPECT_FILTERS), [])

  const scored = useMemo<ScoredProspect[]>(() => {
    const offer = params?.offer ?? 'site'
    return results
      .filter((prospect) => !dismissed.has(prospect.id))
      .map((prospect) => ({ ...prospect, potential: scoreProspect(prospect, offer) }))
  }, [results, dismissed, params])

  const importedIds = useMemo(() => new Set(imported.keys()), [imported])
  const visible = useMemo(() => applyProspectFilters(scored, filters, importedIds), [scored, filters, importedIds])

  const selectAllVisible = useCallback(() => {
    setSelected((current) => {
      const selectable = visible.filter((prospect) => !imported.has(prospect.id)).map((prospect) => prospect.id)
      const allSelected = selectable.length > 0 && selectable.every((id) => current.has(id))
      return allSelected ? new Set() : new Set(selectable)
    })
  }, [visible, imported])

  return {
    usage,
    usageLoading,
    params,
    status,
    error,
    recent,
    scored,
    visible,
    nextPageToken,
    imported,
    importing,
    selected,
    filters,
    search,
    loadMore,
    dismiss,
    importMany,
    toggleSelected,
    selectAllVisible,
    clearSelection: () => setSelected(new Set()),
    setFilters,
    resetFilters,
  }
}
