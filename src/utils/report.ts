// Cálculos do relatório mensal — funções puras, testadas em report.test.mjs.

export interface ReportDeal {
  id: string
  title: string
  value: number | null
  status: string
  stage: string
  service: string | null
  origin: string | null
  created_at: string
  updated_at: string
  won_at?: string | null
  contact_origin?: string | null
}

export interface ReportTransaction {
  type: 'income' | 'expense'
  amount: number
  date: string // data efetiva (paid_at ou dia do lançamento)
}

export interface StageChange {
  deal_id: string
  occurred_at: string
}

export interface ReportBucket {
  label: string
  count: number
  value: number
}

export interface StuckStage {
  stage: string
  count: number
  avgDays: number
}

export interface MonthlyReport {
  sold: number
  soldPrevious: number
  salesCount: number
  ticket: number
  received: number
  expenses: number
  profit: number
  byService: ReportBucket[]
  byOrigin: ReportBucket[]
  avgDaysToClose: number | null
  medianDaysToClose: number | null
  createdCount: number
  wonCount: number
  lostCount: number
  conversion: number | null
  stuck: StuckStage[]
}

const DAY_MS = 24 * 60 * 60 * 1000

export function monthRange(year: number, month: number) {
  return {
    start: new Date(year, month, 1),
    end: new Date(year, month + 1, 1),
    previousStart: new Date(year, month - 1, 1),
  }
}

function inRange(date: string | null | undefined, start: Date, end: Date): boolean {
  if (!date) return false
  const time = new Date(date).getTime()
  return time >= start.getTime() && time < end.getTime()
}

function wonDate(deal: ReportDeal): string {
  return deal.won_at ?? deal.updated_at
}

function group(deals: ReportDeal[], key: (deal: ReportDeal) => string): ReportBucket[] {
  const map = new Map<string, ReportBucket>()
  for (const deal of deals) {
    const label = key(deal)
    const bucket = map.get(label) ?? { label, count: 0, value: 0 }
    bucket.count++
    bucket.value += Number(deal.value ?? 0)
    map.set(label, bucket)
  }
  return [...map.values()].sort((a, b) => b.value - a.value || b.count - a.count)
}

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

export function buildMonthlyReport(
  deals: ReportDeal[],
  transactions: ReportTransaction[],
  stageChanges: StageChange[],
  year: number,
  month: number,
  now = new Date(),
): MonthlyReport {
  const { start, end, previousStart } = monthRange(year, month)
  const won = deals.filter((deal) => deal.status === 'won' && inRange(wonDate(deal), start, end))
  const wonPrevious = deals.filter((deal) => deal.status === 'won' && inRange(wonDate(deal), previousStart, start))
  const lost = deals.filter((deal) => deal.status === 'lost' && inRange(deal.updated_at, start, end))

  const sold = won.reduce((sum, deal) => sum + Number(deal.value ?? 0), 0)
  const monthTransactions = transactions.filter((transaction) => inRange(transaction.date, start, end))
  const received = monthTransactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const expenses = monthTransactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)

  const closeDays = won.map((deal) => Math.max(0, (new Date(wonDate(deal)).getTime() - new Date(deal.created_at).getTime()) / DAY_MS))

  // Onde emperra: negócios abertos hoje, há quantos dias estão na etapa atual.
  const lastChange = new Map<string, string>()
  for (const change of stageChanges) {
    const current = lastChange.get(change.deal_id)
    if (!current || new Date(change.occurred_at) > new Date(current)) lastChange.set(change.deal_id, change.occurred_at)
  }
  const stuckMap = new Map<string, { total: number; count: number }>()
  for (const deal of deals.filter((item) => item.status === 'open')) {
    const since = new Date(lastChange.get(deal.id) ?? deal.created_at)
    const days = Math.max(0, (now.getTime() - since.getTime()) / DAY_MS)
    const entry = stuckMap.get(deal.stage) ?? { total: 0, count: 0 }
    entry.total += days
    entry.count++
    stuckMap.set(deal.stage, entry)
  }

  return {
    sold,
    soldPrevious: wonPrevious.reduce((sum, deal) => sum + Number(deal.value ?? 0), 0),
    salesCount: won.length,
    ticket: won.length > 0 ? sold / won.length : 0,
    received,
    expenses,
    profit: received - expenses,
    byService: group(won, (deal) => deal.service?.trim() || 'Sem serviço informado'),
    byOrigin: group(won, (deal) => deal.contact_origin?.trim() || deal.origin?.trim() || 'Origem não informada'),
    avgDaysToClose: closeDays.length > 0 ? closeDays.reduce((sum, days) => sum + days, 0) / closeDays.length : null,
    medianDaysToClose: median(closeDays),
    createdCount: deals.filter((deal) => inRange(deal.created_at, start, end)).length,
    wonCount: won.length,
    lostCount: lost.length,
    conversion: won.length + lost.length > 0 ? won.length / (won.length + lost.length) : null,
    stuck: [...stuckMap.entries()]
      .map(([stage, entry]) => ({ stage, count: entry.count, avgDays: entry.total / entry.count }))
      .sort((a, b) => b.avgDays - a.avgDays),
  }
}
