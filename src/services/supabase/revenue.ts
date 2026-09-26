import { supabase } from '@/lib/supabaseClient'
import { buildSeries, computeChange, entriesInRange } from '@/utils/revenuePeriod'
import type { ResolvedRange, RevenueEntry, RevenueSource, RevenueSummary } from '@/types'

const UNDEFINED_COLUMN = '42703'

interface WonDealRow {
  id: string
  title: string
  value: number | null
  updated_at: string
  won_at?: string | null
  contact: { name: string } | null
}

interface PaidTransactionRow {
  id: string
  description: string
  amount: number
  date: string
  paid_at: string | null
  contact: { name: string } | null
}

// Data em que o negócio foi ganho. Sem a migração 0012 (coluna won_at), cai
// para updated_at — o comportamento antigo.
export function wonDate(deal: { won_at?: string | null; updated_at: string }): string {
  return deal.won_at ?? deal.updated_at
}

// Seleciona negócios incluindo won_at quando a coluna existe. updated_at é
// sempre >= won_at, então filtrar por updated_at nunca perde um ganho.
export async function selectWonDeals<T>(columns: string, since: Date | null): Promise<T[]> {
  const run = (select: string) => {
    let query = supabase.from('deals').select(select).eq('status', 'won')
    if (since) query = query.gte('updated_at', since.toISOString())
    return query
  }

  const withWonAt = await run(`${columns}, won_at`)
  if (!withWonAt.error) return (withWonAt.data ?? []) as T[]
  if (withWonAt.error.code !== UNDEFINED_COLUMN) throw new Error(withWonAt.error.message)

  const fallback = await run(columns)
  if (fallback.error) throw new Error(fallback.error.message)
  return (fallback.data ?? []) as T[]
}

async function fetchSoldEntries(since: Date): Promise<RevenueEntry[]> {
  const rows = await selectWonDeals<WonDealRow>('id, title, value, updated_at, contact:contacts(name)', since)
  return rows.map((row) => ({
    id: `deal-${row.id}`,
    amount: Number(row.value ?? 0),
    date: wonDate(row),
    title: row.title,
    subtitle: row.contact?.name ?? null,
  }))
}

// Data efetiva de um lançamento pago: paid_at quando existe, senão o dia do
// lançamento (meio-dia local, para não cair no dia anterior por fuso).
function paidDate(row: PaidTransactionRow): string {
  return row.paid_at ?? new Date(`${row.date}T12:00:00`).toISOString()
}

async function fetchPaidTransactions(type: 'income' | 'expense', since: Date): Promise<RevenueEntry[]> {
  const sinceDay = since.toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('transactions')
    .select('id, description, amount, date, paid_at, contact:contacts(name)')
    .eq('type', type)
    .eq('status', 'paid')
    .or(`paid_at.gte.${since.toISOString()},date.gte.${sinceDay}`)

  if (error) throw new Error(error.message)
  return ((data ?? []) as unknown as PaidTransactionRow[]).map((row) => ({
    id: `tx-${row.id}`,
    amount: Number(row.amount),
    date: paidDate(row),
    title: row.description,
    subtitle: row.contact?.name ?? null,
  }))
}

export async function getRevenueSummary(range: ResolvedRange, source: RevenueSource): Promise<RevenueSummary> {
  const entries =
    source === 'sold'
      ? await fetchSoldEntries(range.previousStart)
      : await fetchPaidTransactions('income', range.previousStart)

  const current = entriesInRange(entries, range.start, range.end)
  const previous = entriesInRange(entries, range.previousStart, range.previousEnd)
  const total = current.reduce((sum, entry) => sum + entry.amount, 0)
  const previousTotal = previous.reduce((sum, entry) => sum + entry.amount, 0)

  return {
    total,
    previousTotal,
    count: current.length,
    change: computeChange(total, previousTotal, range.compareLabel),
    series: buildSeries(entries, range),
    entries: current.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  }
}

// Lucro do período = entradas pagas − despesas pagas (Financeiro).
export async function getPeriodProfit(range: ResolvedRange): Promise<{ received: number; expenses: number }> {
  const [income, expenses] = await Promise.all([
    fetchPaidTransactions('income', range.start),
    fetchPaidTransactions('expense', range.start),
  ])
  const sum = (entries: RevenueEntry[]) =>
    entriesInRange(entries, range.start, range.end).reduce((total, entry) => total + entry.amount, 0)
  return { received: sum(income), expenses: sum(expenses) }
}
