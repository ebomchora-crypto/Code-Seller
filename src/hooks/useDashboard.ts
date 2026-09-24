import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getActivityFeed,
  getDashboardMetrics,
  getPipelineChart,
  getRecentContacts,
  getRecentDeals,
  getRevenueChart,
} from '@/services/supabase/dashboard'
import type { ActivityFeedItem, Contact, DashboardMetric, Deal, PipelineDataPoint, RevenueDataPoint } from '@/types'

interface SectionState<T> {
  data: T
  loading: boolean
  error: string | null
}

function initialSection<T>(fallback: T): SectionState<T> {
  return { data: fallback, loading: true, error: null }
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Não foi possível carregar estes dados.'
}

interface UseDashboardOptions {
  autoRefreshMs?: number // padrão: desligado (undefined)
}

export function useDashboard(options: UseDashboardOptions = {}) {
  const [metrics, setMetrics] = useState<SectionState<DashboardMetric[]>>(initialSection([]))
  const [revenueChart, setRevenueChart] = useState<SectionState<RevenueDataPoint[]>>(initialSection([]))
  const [pipelineChart, setPipelineChart] = useState<SectionState<PipelineDataPoint[]>>(initialSection([]))
  const [recentDeals, setRecentDeals] = useState<SectionState<Deal[]>>(initialSection([]))
  const [recentContacts, setRecentContacts] = useState<SectionState<Contact[]>>(initialSection([]))
  const [activityFeed, setActivityFeed] = useState<SectionState<ActivityFeedItem[]>>(initialSection([]))
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchAll = useCallback(async () => {
    setMetrics((current) => ({ ...current, loading: true, error: null }))
    setRevenueChart((current) => ({ ...current, loading: true, error: null }))
    setPipelineChart((current) => ({ ...current, loading: true, error: null }))
    setRecentDeals((current) => ({ ...current, loading: true, error: null }))
    setRecentContacts((current) => ({ ...current, loading: true, error: null }))
    setActivityFeed((current) => ({ ...current, loading: true, error: null }))

    const [metricsResult, revenueResult, pipelineResult, dealsResult, contactsResult, feedResult] =
      await Promise.allSettled([
        getDashboardMetrics(),
        getRevenueChart(),
        getPipelineChart(),
        getRecentDeals(),
        getRecentContacts(),
        getActivityFeed(),
      ])

    setMetrics(
      metricsResult.status === 'fulfilled'
        ? { data: metricsResult.value, loading: false, error: null }
        : { data: [], loading: false, error: errorMessage(metricsResult.reason) },
    )
    setRevenueChart(
      revenueResult.status === 'fulfilled'
        ? { data: revenueResult.value, loading: false, error: null }
        : { data: [], loading: false, error: errorMessage(revenueResult.reason) },
    )
    setPipelineChart(
      pipelineResult.status === 'fulfilled'
        ? { data: pipelineResult.value, loading: false, error: null }
        : { data: [], loading: false, error: errorMessage(pipelineResult.reason) },
    )
    setRecentDeals(
      dealsResult.status === 'fulfilled'
        ? { data: dealsResult.value, loading: false, error: null }
        : { data: [], loading: false, error: errorMessage(dealsResult.reason) },
    )
    setRecentContacts(
      contactsResult.status === 'fulfilled'
        ? { data: contactsResult.value, loading: false, error: null }
        : { data: [], loading: false, error: errorMessage(contactsResult.reason) },
    )
    setActivityFeed(
      feedResult.status === 'fulfilled'
        ? { data: feedResult.value, loading: false, error: null }
        : { data: [], loading: false, error: errorMessage(feedResult.reason) },
    )

    setLastUpdated(new Date())
  }, [])

  useEffect(() => {
    void fetchAll()
  }, [fetchAll])

  const autoRefreshMs = options.autoRefreshMs
  const fetchAllRef = useRef(fetchAll)

  useEffect(() => {
    fetchAllRef.current = fetchAll
  }, [fetchAll])

  useEffect(() => {
    if (!autoRefreshMs) return
    const interval = setInterval(() => void fetchAllRef.current(), autoRefreshMs)
    return () => clearInterval(interval)
  }, [autoRefreshMs])

  return {
    metrics,
    revenueChart,
    pipelineChart,
    recentDeals,
    recentContacts,
    activityFeed,
    lastUpdated,
    refetch: fetchAll,
  }
}
