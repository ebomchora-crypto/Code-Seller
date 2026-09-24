import { supabase } from '@/lib/supabaseClient'
import { getContacts } from '@/services/supabase/contacts'
import { getDeals } from '@/services/supabase/deals'
import { getTaskMetrics } from '@/services/supabase/tasks'
import { DEAL_STAGES } from '@/utils/deals'
import type {
  ActivityFeedItem,
  Contact,
  DashboardData,
  DashboardMetric,
  Deal,
  PipelineDataPoint,
  RevenueDataPoint,
} from '@/types'

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function monthLabel(date: Date): string {
  const label = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function monthFullLabel(date: Date): string {
  const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function percentChange(current: number, previous: number): DashboardMetric['change'] {
  if (previous === 0) {
    if (current === 0) return { value: 0, direction: 'neutral', label: 'vs. mês anterior' }
    return { value: 100, direction: 'up', label: 'vs. mês anterior' }
  }
  const diff = ((current - previous) / previous) * 100
  return {
    value: Math.round(Math.abs(diff) * 10) / 10,
    direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral',
    label: 'vs. mês anterior',
  }
}

interface LeanDeal {
  id: string
  status: 'open' | 'won' | 'lost' | 'paused'
  stage: string
  value: number | null
  created_at: string
  updated_at: string
}

interface LeanContact {
  id: string
  created_at: string
}

async function fetchLeanDeals(): Promise<LeanDeal[]> {
  const { data, error } = await supabase
    .from('deals')
    .select('id, status, stage, value, created_at, updated_at')

  if (error) throw new Error(error.message)
  return data ?? []
}

async function fetchLeanContacts(): Promise<LeanContact[]> {
  const { data, error } = await supabase.from('contacts').select('id, created_at')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getDashboardMetrics(): Promise<DashboardMetric[]> {
  const now = new Date()
  const currentMonthStart = startOfMonth(now)
  const previousMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1))
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

  const [deals, contacts, taskMetrics] = await Promise.all([fetchLeanDeals(), fetchLeanContacts(), getTaskMetrics()])

  // Métrica 1 — Receita do mês (deals won, agrupado por updated_at)
  const revenueThisMonth = deals
    .filter((deal) => deal.status === 'won' && new Date(deal.updated_at) >= currentMonthStart)
    .reduce((sum, deal) => sum + (deal.value ?? 0), 0)
  const revenuePreviousMonth = deals
    .filter(
      (deal) =>
        deal.status === 'won' &&
        new Date(deal.updated_at) >= previousMonthStart &&
        new Date(deal.updated_at) < currentMonthStart,
    )
    .reduce((sum, deal) => sum + (deal.value ?? 0), 0)

  // Métrica 2 — Deals ativos (contagem atual, uma métrica de estoque/gauge).
  // Não calculamos variação aqui: o banco não guarda um snapshot histórico da
  // contagem de deals abertos, então qualquer "variação vs. mês anterior"
  // seria inventada. Métricas de fluxo (1 e 5) têm variação real; esta não.
  const activeDeals = deals.filter((deal) => deal.status === 'open')
  const activeDealsCount = activeDeals.length

  // Métrica 3 — Valor total em pipeline (também um gauge, sem variação)
  const pipelineValue = activeDeals.reduce((sum, deal) => sum + (deal.value ?? 0), 0)

  // Métrica 4 — Taxa de conversão nos últimos 90 dias
  const recentResolved = deals.filter(
    (deal) => (deal.status === 'won' || deal.status === 'lost') && new Date(deal.updated_at) >= ninetyDaysAgo,
  )
  const recentWon = recentResolved.filter((deal) => deal.status === 'won').length
  const conversionRate = recentResolved.length > 0 ? (recentWon / recentResolved.length) * 100 : 0

  // Métrica 5 — Contatos criados este mês
  const contactsThisMonth = contacts.filter((contact) => new Date(contact.created_at) >= currentMonthStart).length
  const contactsPreviousMonth = contacts.filter(
    (contact) =>
      new Date(contact.created_at) >= previousMonthStart && new Date(contact.created_at) < currentMonthStart,
  ).length

  return [
    {
      label: 'Receita do mês',
      value: formatCurrency(revenueThisMonth),
      raw_value: revenueThisMonth,
      change: percentChange(revenueThisMonth, revenuePreviousMonth),
      icon: 'DollarSign',
      accent: 'green',
    },
    {
      label: 'Deals ativos',
      value: activeDealsCount.toString(),
      raw_value: activeDealsCount,
      icon: 'Briefcase',
      accent: 'purple',
    },
    {
      label: 'Valor em pipeline',
      value: formatCurrency(pipelineValue),
      raw_value: pipelineValue,
      icon: 'TrendingUp',
      accent: 'blue',
    },
    {
      label: 'Taxa de conversão',
      value: `${conversionRate.toFixed(0)}%`,
      raw_value: conversionRate,
      icon: 'Target',
      accent: 'amber',
    },
    {
      label: 'Contatos este mês',
      value: contactsThisMonth.toString(),
      raw_value: contactsThisMonth,
      change: percentChange(contactsThisMonth, contactsPreviousMonth),
      icon: 'Users',
      accent: 'purple',
    },
    {
      label: 'Tarefas pendentes',
      value: taskMetrics.pending.toString(),
      raw_value: taskMetrics.pending,
      icon: 'CheckSquare',
      accent: 'purple',
    },
  ]
}

export async function getRevenueChart(months = 6): Promise<RevenueDataPoint[]> {
  const now = new Date()
  const rangeStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - (months - 1), 1))

  const { data, error } = await supabase
    .from('deals')
    .select('value, updated_at')
    .eq('status', 'won')
    .gte('updated_at', rangeStart.toISOString())

  if (error) throw new Error(error.message)

  const buckets: RevenueDataPoint[] = []
  for (let i = months - 1; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
    buckets.push({ month: monthLabel(monthDate), month_full: monthFullLabel(monthDate), value: 0 })
  }

  for (const row of data ?? []) {
    const rowDate = new Date(row.updated_at)
    const monthIndex = months - 1 - (now.getFullYear() * 12 + now.getMonth() - (rowDate.getFullYear() * 12 + rowDate.getMonth()))
    if (monthIndex >= 0 && monthIndex < months) {
      buckets[monthIndex].value += row.value ?? 0
    }
  }

  return buckets
}

const PIPELINE_STAGES = DEAL_STAGES.filter((stage) => stage.key !== 'won' && stage.key !== 'lost')

export async function getPipelineChart(): Promise<PipelineDataPoint[]> {
  const { data, error } = await supabase.from('deals').select('stage, value').eq('status', 'open')
  if (error) throw new Error(error.message)

  return PIPELINE_STAGES.map((stage) => {
    const stageDeals = (data ?? []).filter((row) => row.stage === stage.key)
    return {
      stage: stage.key,
      label: stage.label,
      count: stageDeals.length,
      value: stageDeals.reduce((sum, row) => sum + (row.value ?? 0), 0),
    }
  })
}

export async function getRecentDeals(limit = 5): Promise<Deal[]> {
  const result = await getDeals({ status: 'open' })
  return [...result.data]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, limit)
}

export async function getRecentContacts(limit = 5): Promise<Contact[]> {
  const result = await getContacts({ sortColumn: 'created_at', sortDirection: 'desc', pageSize: limit })
  return result.data
}

interface RawInteractionFeedRow {
  id: string
  contact_id: string
  type: string
  content: string
  occurred_at: string
  created_at: string
  contact: { name: string } | null
}

interface RawDealActivityFeedRow {
  id: string
  deal_id: string
  type: string
  content: string
  occurred_at: string
  created_at: string
  deal: { title: string; contact: { name: string } | null } | null
}

export async function getActivityFeed(limit = 10): Promise<ActivityFeedItem[]> {
  const [interactionsResult, dealActivitiesResult] = await Promise.all([
    supabase
      .from('interactions')
      .select('id, contact_id, type, content, occurred_at, created_at, contact:contacts(name)')
      .order('occurred_at', { ascending: false })
      .limit(limit),
    supabase
      .from('deal_activities')
      .select('id, deal_id, type, content, occurred_at, created_at, deal:deals(title, contact:contacts(name))')
      .order('occurred_at', { ascending: false })
      .limit(limit),
  ])

  if (interactionsResult.error) throw new Error(interactionsResult.error.message)
  if (dealActivitiesResult.error) throw new Error(dealActivitiesResult.error.message)

  const crmItems: ActivityFeedItem[] = ((interactionsResult.data ?? []) as unknown as RawInteractionFeedRow[]).map(
    (row) => ({
      id: row.id,
      source: 'crm',
      type: row.type,
      content: row.content,
      contact_id: row.contact_id,
      contact_name: row.contact?.name,
      occurred_at: row.occurred_at,
      created_at: row.created_at,
    }),
  )

  const dealItems: ActivityFeedItem[] = ((dealActivitiesResult.data ?? []) as unknown as RawDealActivityFeedRow[]).map(
    (row) => ({
      id: row.id,
      source: 'deal',
      type: row.type,
      content: row.content,
      deal_id: row.deal_id,
      deal_title: row.deal?.title,
      contact_name: row.deal?.contact?.name,
      occurred_at: row.occurred_at,
      created_at: row.created_at,
    }),
  )

  return [...crmItems, ...dealItems]
    .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())
    .slice(0, limit)
}

export async function getDashboardData(): Promise<DashboardData> {
  const [metrics, revenue_chart, pipeline_chart, recent_deals, recent_contacts, activity_feed] = await Promise.all([
    getDashboardMetrics(),
    getRevenueChart(),
    getPipelineChart(),
    getRecentDeals(),
    getRecentContacts(),
    getActivityFeed(),
  ])

  return { metrics, revenue_chart, pipeline_chart, recent_deals, recent_contacts, activity_feed }
}
