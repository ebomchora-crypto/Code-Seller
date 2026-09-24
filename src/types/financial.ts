export type TransactionType = 'income' | 'expense'
export type TransactionStatus = 'pending' | 'paid' | 'overdue' | 'cancelled'
export type PaymentMethod = 'pix' | 'boleto' | 'credit_card' | 'debit_card' | 'transfer' | 'cash' | 'other'
export type Recurrence = 'none' | 'monthly' | 'quarterly' | 'yearly'
export type ReceivableStatus = 'pending' | 'paid' | 'overdue' | 'cancelled'

export interface FinancialCategory {
  id: string
  user_id: string
  name: string
  type: TransactionType
  color: string
  icon: string | null
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  type: TransactionType
  status: TransactionStatus
  description: string
  amount: number
  date: string
  due_date: string | null
  paid_at: string | null
  category_id: string | null
  contact_id: string | null
  deal_id: string | null
  payment_method: PaymentMethod | null
  recurrence: Recurrence
  recurrence_end_date: string | null
  receipt_url: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Relações opcionais (join)
  category?: FinancialCategory
  contact?: { id: string; name: string }
  deal?: { id: string; title: string }
}

export interface Receivable {
  id: string
  user_id: string
  deal_id: string
  contact_id: string | null
  description: string
  amount: number
  due_date: string | null
  status: ReceivableStatus
  paid_at: string | null
  transaction_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Relações opcionais (join)
  deal?: { id: string; title: string; value: number | null }
  contact?: { id: string; name: string }
  transaction?: { id: string; description: string }
}

export interface TransactionFilters {
  search: string
  type: TransactionType | 'all'
  status: TransactionStatus | 'all'
  category_id: string
  payment_method: PaymentMethod | 'all'
  date_from: string
  date_to: string
}

// Métricas financeiras do mês
export interface FinancialMetrics {
  balance: number // saldo atual (receitas pagas - despesas pagas)
  income_month: number // receitas do mês (pagas)
  expense_month: number // despesas do mês (pagas)
  income_month_change?: number // variação % vs. mês anterior
  expense_month_change?: number // variação % vs. mês anterior
  pending_income: number // receitas pendentes
  pending_expense: number // despesas pendentes
  receivables_total: number // total em contas a receber
  receivables_overdue: number // contas a receber vencidas
}

// Ponto de dados para gráfico de fluxo de caixa
export interface CashFlowDataPoint {
  month: string // "Jan", "Fev"...
  month_full: string // "Janeiro 2025"
  income: number
  expense: number
  balance: number // income - expense acumulado
}

export const CATEGORY_COLOR_SWATCHES = [
  '#b35cff',
  '#3b82f6',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#6366f1',
  '#71717a',
]
