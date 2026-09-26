import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getRevenueSummary } from '@/services/supabase/revenue'
import { resolveRange } from '@/utils/revenuePeriod'
import type { CustomRange, RevenueEntry, RevenuePeriod, RevenueSource, RevenueSummary } from '@/types'

interface Options {
  period: RevenuePeriod
  custom: CustomRange | null
  source: RevenueSource
  /** Recarrega sozinho a cada N ms (Sala de receita). */
  pollMs?: number
  /** Chamado com os lançamentos que apareceram desde a última carga. */
  onNewEntries?: (entries: RevenueEntry[]) => void
}

export function useRevenuePeriod({ period, custom, source, pollMs, onNewEntries }: Options) {
  const [summary, setSummary] = useState<RevenueSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const knownIds = useRef<Set<string> | null>(null)
  const onNewRef = useRef(onNewEntries)
  useEffect(() => {
    onNewRef.current = onNewEntries
  }, [onNewEntries])

  const key = `${period}|${custom?.from ?? ''}|${custom?.to ?? ''}|${source}`
  const range = useMemo(() => resolveRange(period, custom), [period, custom])

  const load = useCallback(
    async (silent: boolean) => {
      if (!silent) setLoading(true)
      try {
        const next = await getRevenueSummary(resolveRange(period, custom), source)
        const ids = new Set(next.entries.map((entry) => entry.id))
        if (knownIds.current && onNewRef.current) {
          const fresh = next.entries.filter((entry) => !knownIds.current?.has(entry.id))
          if (fresh.length > 0) onNewRef.current(fresh)
        }
        knownIds.current = ids
        setSummary(next)
        setError(null)
        setLastUpdated(new Date())
      } catch (reason) {
        if (!silent) setError(reason instanceof Error ? reason.message : 'Não foi possível carregar a receita.')
      } finally {
        if (!silent) setLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  )

  useEffect(() => {
    knownIds.current = null
    void load(false)
  }, [load])

  useEffect(() => {
    if (!pollMs) return
    const timer = window.setInterval(() => void load(true), pollMs)
    const onFocus = () => void load(true)
    window.addEventListener('focus', onFocus)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', onFocus)
    }
  }, [load, pollMs])

  return { summary, range, loading, error, lastUpdated, refetch: () => load(false) }
}
