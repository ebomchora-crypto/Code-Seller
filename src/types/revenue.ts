// Receita por período — card do Início e Sala de receita.

export type RevenuePeriod = 'today' | 'week' | 'month' | 'custom'

// Vendido = negócios ganhos; Recebido = entradas pagas no Financeiro.
export type RevenueSource = 'sold' | 'received'

export interface CustomRange {
  from: string // YYYY-MM-DD
  to: string // YYYY-MM-DD (inclusivo)
}

export interface ResolvedRange {
  start: Date
  end: Date // exclusivo
  previousStart: Date
  previousEnd: Date
  granularity: 'hour' | 'day'
  compareLabel: string
}

export interface RevenuePoint {
  label: string
  full_label: string
  value: number
  previous: number
}

export interface RevenueEntry {
  id: string
  amount: number
  date: string
  title: string
  subtitle: string | null
}

export interface RevenueChange {
  value: number
  direction: 'up' | 'down' | 'neutral'
  label: string
}

export interface RevenueSummary {
  total: number
  previousTotal: number
  count: number
  change: RevenueChange
  series: RevenuePoint[]
  entries: RevenueEntry[]
}
