import { supabase } from '@/lib/supabaseClient'
import { buildMonthlyReport, monthRange, type MonthlyReport, type ReportDeal, type ReportTransaction } from '@/utils/report'

const DEAL_COLUMNS = 'id, title, value, status, stage, service, origin, created_at, updated_at, contact:contacts(origin)'

interface RawDeal extends Omit<ReportDeal, 'contact_origin'> {
  contact: { origin: string | null } | null
}

async function fetchDeals(): Promise<ReportDeal[]> {
  let result = await supabase.from('deals').select(`${DEAL_COLUMNS}, won_at`)
  // Sem a migração 0012 (won_at), segue sem a coluna.
  if (result.error?.code === '42703') result = await supabase.from('deals').select(DEAL_COLUMNS)
  if (result.error) throw new Error(result.error.message)
  return ((result.data ?? []) as unknown as RawDeal[]).map(({ contact, ...deal }) => ({
    ...deal,
    contact_origin: contact?.origin ?? null,
  }))
}

async function fetchTransactions(since: Date): Promise<ReportTransaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('type, amount, date, paid_at, status')
    .eq('status', 'paid')
    .or(`paid_at.gte.${since.toISOString()},date.gte.${since.toISOString().slice(0, 10)}`)
  if (error) throw new Error(error.message)
  return ((data ?? []) as { type: 'income' | 'expense'; amount: number; date: string; paid_at: string | null; status: string }[])
    .filter((row) => row.status === 'paid')
    .map((row) => ({
      type: row.type,
      amount: Number(row.amount),
      date: row.paid_at ?? new Date(`${row.date}T12:00:00`).toISOString(),
    }))
}

async function fetchStageChanges() {
  const { data } = await supabase.from('deal_activities').select('deal_id, occurred_at').eq('type', 'stage_change')
  return (data ?? []) as { deal_id: string; occurred_at: string }[]
}

async function countSince(table: string, column: string, start: Date, end: Date, extra?: (query: any) => any) {
  let query = supabase.from(table).select('id', { count: 'exact', head: true }).gte(column, start.toISOString()).lt(column, end.toISOString())
  if (extra) query = extra(query)
  const { count } = await query
  return count ?? 0
}

export interface MonthlyReportData extends MonthlyReport {
  newContacts: number
  interactions: number
  tasksDone: number
}

export async function getMonthlyReport(year: number, month: number): Promise<MonthlyReportData> {
  const { start, end, previousStart } = monthRange(year, month)
  const [deals, transactions, changes, newContacts, interactions, tasksDone] = await Promise.all([
    fetchDeals(),
    fetchTransactions(previousStart),
    fetchStageChanges(),
    countSince('contacts', 'created_at', start, end),
    countSince('interactions', 'occurred_at', start, end),
    countSince('tasks', 'completed_at', start, end, (query) => query.eq('status', 'done')),
  ])
  return { ...buildMonthlyReport(deals, transactions, changes, year, month), newContacts, interactions, tasksDone }
}
