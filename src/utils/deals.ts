import type { Deal, DealStage, PipelineMetrics } from '@/types'

export const DEAL_STAGES: {
  key: DealStage
  label: string
  color: string
  default_probability: number
}[] = [
  { key: 'contact', label: 'Contato', color: '#b35cff', default_probability: 10 },
  { key: 'qualified', label: 'Qualificado', color: '#6366f1', default_probability: 25 },
  { key: 'proposal', label: 'Proposta', color: '#3b82f6', default_probability: 50 },
  { key: 'negotiation', label: 'Negociação', color: '#f59e0b', default_probability: 70 },
  { key: 'closing', label: 'Fechamento', color: '#10b981', default_probability: 90 },
  { key: 'won', label: 'Ganho', color: '#22c55e', default_probability: 100 },
  { key: 'lost', label: 'Perdido', color: '#ef4444', default_probability: 0 },
]

export function getStageConfig(stage: DealStage) {
  return DEAL_STAGES.find((item) => item.key === stage) ?? DEAL_STAGES[0]
}

export function calculatePipelineMetrics(deals: Deal[]): PipelineMetrics {
  const dealsByStage = DEAL_STAGES.reduce(
    (acc, stage) => {
      acc[stage.key] = { count: 0, value: 0 }
      return acc
    },
    {} as Record<DealStage, { count: number; value: number }>,
  )

  let totalValue = 0
  let wonValue = 0
  let lostValue = 0
  let openValue = 0
  let wonCount = 0
  let lostCount = 0

  for (const deal of deals) {
    const value = deal.value ?? 0
    totalValue += value
    dealsByStage[deal.stage].count += 1
    dealsByStage[deal.stage].value += value

    if (deal.status === 'won') {
      wonValue += value
      wonCount += 1
    } else if (deal.status === 'lost') {
      lostValue += value
      lostCount += 1
    } else if (deal.status === 'open') {
      openValue += value
    }
  }

  const conversionRate = wonCount + lostCount > 0 ? (wonCount / (wonCount + lostCount)) * 100 : 0
  const avgDealValue = wonCount > 0 ? wonValue / wonCount : 0

  return {
    total_deals: deals.length,
    total_value: totalValue,
    won_value: wonValue,
    lost_value: lostValue,
    open_value: openValue,
    conversion_rate: conversionRate,
    avg_deal_value: avgDealValue,
    deals_by_stage: dealsByStage,
  }
}

export function formatCurrency(value: number | null): string {
  if (value === null) return '—'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
