import { formatCurrency as formatDealCurrency } from '@/utils/deals'
import type { PaymentMethod, Recurrence, Transaction, TransactionStatus } from '@/types'

// Reexporta o formatador já existente em utils/deals.ts — mesma formatação
// BRL usada em todo o app, sem duplicar a lógica.
export function formatCurrency(value: number): string {
  return formatDealCurrency(value)
}

export type OverdueStatus = 'overdue' | 'due_today' | 'upcoming' | 'paid' | 'cancelled'

export function getOverdueStatus(due_date: string | null, status: TransactionStatus): OverdueStatus {
  if (status === 'paid') return 'paid'
  if (status === 'cancelled') return 'cancelled'
  if (!due_date) return 'upcoming'

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(`${due_date}T00:00:00`)

  if (due.getTime() < today.getTime()) return 'overdue'
  if (due.getTime() === today.getTime()) return 'due_today'
  return 'upcoming'
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pix: 'Pix',
  boleto: 'Boleto',
  credit_card: 'Cartão de crédito',
  debit_card: 'Cartão de débito',
  transfer: 'Transferência',
  cash: 'Dinheiro',
  other: 'Outro',
}

export const RECURRENCE_LABELS: Record<Recurrence, string> = {
  none: 'Sem recorrência',
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  yearly: 'Anual',
}

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  overdue: 'Vencido',
  cancelled: 'Cancelado',
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function formatDateForCSV(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR')
}

export function generateTransactionsCSV(transactions: Transaction[]): string {
  const headers = [
    'Data',
    'Descrição',
    'Tipo',
    'Categoria',
    'Valor',
    'Status',
    'Método de Pagamento',
    'Contato',
    'Deal',
    'Observações',
  ]

  const rows = transactions.map((transaction) => [
    formatDateForCSV(transaction.date),
    transaction.description,
    transaction.type === 'income' ? 'Receita' : 'Despesa',
    transaction.category?.name ?? '',
    transaction.amount.toFixed(2).replace('.', ','),
    TRANSACTION_STATUS_LABELS[transaction.status],
    transaction.payment_method ? PAYMENT_METHOD_LABELS[transaction.payment_method] : '',
    transaction.contact?.name ?? '',
    transaction.deal?.title ?? '',
    transaction.notes ?? '',
  ])

  const lines = [headers, ...rows].map((row) => row.map((cell) => csvEscape(String(cell))).join(','))
  return lines.join('\n')
}
