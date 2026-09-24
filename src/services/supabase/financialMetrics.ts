import { supabase } from '@/lib/supabaseClient'
import type { CashFlowDataPoint, FinancialMetrics } from '@/types'

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

function percentChange(current: number, previous: number): number | undefined {
  if (previous === 0) return current === 0 ? undefined : 100
  return Math.round(((current - previous) / previous) * 1000) / 10
}

interface LeanTransaction {
  type: 'income' | 'expense'
  status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  amount: number
  date: string
}

interface LeanReceivable {
  amount: number
  status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  due_date: string | null
}

async function fetchLeanTransactions(): Promise<LeanTransaction[]> {
  const { data, error } = await supabase.from('transactions').select('type, status, amount, date')
  if (error) throw new Error(error.message)
  return data ?? []
}

async function fetchLeanReceivables(): Promise<LeanReceivable[]> {
  const { data, error } = await supabase.from('receivables').select('amount, status, due_date')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getFinancialMetrics(): Promise<FinancialMetrics> {
  const now = new Date()
  const currentMonthStart = startOfMonth(now)
  const previousMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1))
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [transactions, receivables] = await Promise.all([fetchLeanTransactions(), fetchLeanReceivables()])

  const paidIncome = transactions.filter((t) => t.type === 'income' && t.status === 'paid')
  const paidExpense = transactions.filter((t) => t.type === 'expense' && t.status === 'paid')

  const balance = paidIncome.reduce((sum, t) => sum + t.amount, 0) - paidExpense.reduce((sum, t) => sum + t.amount, 0)

  const inMonth = (t: LeanTransaction, start: Date, end: Date) => {
    const date = new Date(`${t.date}T00:00:00`)
    return date >= start && date < end
  }

  const incomeMonth = paidIncome
    .filter((t) => inMonth(t, currentMonthStart, now))
    .reduce((sum, t) => sum + t.amount, 0)
  const incomePreviousMonth = paidIncome
    .filter((t) => inMonth(t, previousMonthStart, currentMonthStart))
    .reduce((sum, t) => sum + t.amount, 0)

  const expenseMonth = paidExpense
    .filter((t) => inMonth(t, currentMonthStart, now))
    .reduce((sum, t) => sum + t.amount, 0)
  const expensePreviousMonth = paidExpense
    .filter((t) => inMonth(t, previousMonthStart, currentMonthStart))
    .reduce((sum, t) => sum + t.amount, 0)

  const pendingIncome = transactions
    .filter((t) => t.type === 'income' && t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0)
  const pendingExpense = transactions
    .filter((t) => t.type === 'expense' && t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0)

  const pendingReceivables = receivables.filter((r) => r.status === 'pending')
  const receivablesTotal = pendingReceivables.reduce((sum, r) => sum + r.amount, 0)
  const receivablesOverdue = pendingReceivables
    .filter((r) => r.due_date && new Date(`${r.due_date}T00:00:00`) < today)
    .reduce((sum, r) => sum + r.amount, 0)

  return {
    balance,
    income_month: incomeMonth,
    expense_month: expenseMonth,
    income_month_change: percentChange(incomeMonth, incomePreviousMonth),
    expense_month_change: percentChange(expenseMonth, expensePreviousMonth),
    pending_income: pendingIncome,
    pending_expense: pendingExpense,
    receivables_total: receivablesTotal,
    receivables_overdue: receivablesOverdue,
  }
}

export async function getCashFlowChart(months = 6): Promise<CashFlowDataPoint[]> {
  const now = new Date()
  const rangeStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - (months - 1), 1))

  const { data, error } = await supabase
    .from('transactions')
    .select('type, amount, date')
    .eq('status', 'paid')
    .gte('date', rangeStart.toISOString().slice(0, 10))

  if (error) throw new Error(error.message)

  const buckets: CashFlowDataPoint[] = []
  for (let i = months - 1; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
    buckets.push({ month: monthLabel(monthDate), month_full: monthFullLabel(monthDate), income: 0, expense: 0, balance: 0 })
  }

  for (const row of data ?? []) {
    const rowDate = new Date(`${row.date}T00:00:00`)
    const monthIndex =
      months - 1 - (now.getFullYear() * 12 + now.getMonth() - (rowDate.getFullYear() * 12 + rowDate.getMonth()))
    if (monthIndex >= 0 && monthIndex < months) {
      if (row.type === 'income') buckets[monthIndex].income += row.amount
      else buckets[monthIndex].expense += row.amount
    }
  }

  let cumulative = 0
  for (const bucket of buckets) {
    cumulative += bucket.income - bucket.expense
    bucket.balance = cumulative
  }

  return buckets
}
