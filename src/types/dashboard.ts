import type { Contact } from './crm'
import type { Deal, DealStage } from './deals'

export type MetricAccent = 'purple' | 'green' | 'amber' | 'blue' | 'red' | 'neutral'

// Métrica individual do dashboard
export interface DashboardMetric {
  label: string
  value: string // já formatado (ex: "R$ 12.500", "47%", "23")
  raw_value: number // valor numérico bruto para animações
  change?: {
    value: number // ex: 12.5 (%)
    direction: 'up' | 'down' | 'neutral'
    label: string // ex: "vs. mês anterior"
  }
  icon: string // nome do ícone (Lucide)
  accent: MetricAccent
  tooltip?: string // usado quando o dado ainda não existe (ex: Tarefas pendentes)
}

// Ponto de dados para gráfico de receita
export interface RevenueDataPoint {
  month: string // ex: "Jan", "Fev", "Mar"
  month_full: string // ex: "Janeiro 2025"
  value: number
}

// Ponto de dados para gráfico de pipeline
export interface PipelineDataPoint {
  stage: DealStage
  label: string
  count: number
  value: number
}

// Item unificado do feed de atividades
export interface ActivityFeedItem {
  id: string
  source: 'crm' | 'deal'
  type: string
  content: string
  contact_id?: string
  contact_name?: string
  deal_id?: string
  deal_title?: string
  occurred_at: string
  created_at: string
}

// Estado completo do Dashboard
export interface DashboardData {
  metrics: DashboardMetric[]
  revenue_chart: RevenueDataPoint[]
  pipeline_chart: PipelineDataPoint[]
  recent_deals: Deal[]
  recent_contacts: Contact[]
  activity_feed: ActivityFeedItem[]
}
