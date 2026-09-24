import { supabase } from '@/lib/supabaseClient'
import { generateTransactionsCSV } from '@/utils/financial'
import type { Recurrence, Transaction, TransactionFilters } from '@/types'

const TRANSACTION_SELECT = '*, category:financial_categories(*), contact:contacts(id, name), deal:deals(id, title)'

export async function getTransactions(filters: Partial<TransactionFilters> = {}): Promise<Transaction[]> {
  let query = supabase.from('transactions').select(TRANSACTION_SELECT)

  if (filters.search) {
    const term = filters.search.trim()
    if (term) {
      query = query.ilike('description', `%${term}%`)
    }
  }
  if (filters.type && filters.type !== 'all') {
    query = query.eq('type', filters.type)
  }
  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  if (filters.category_id) {
    query = query.eq('category_id', filters.category_id)
  }
  if (filters.payment_method && filters.payment_method !== 'all') {
    query = query.eq('payment_method', filters.payment_method)
  }
  if (filters.date_from) {
    query = query.gte('date', filters.date_from)
  }
  if (filters.date_to) {
    query = query.lte('date', filters.date_to)
  }

  query = query.order('date', { ascending: false })

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as Transaction[]
}

export async function getTransactionById(id: string): Promise<Transaction | null> {
  const { data, error } = await supabase.from('transactions').select(TRANSACTION_SELECT).eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  return (data as unknown as Transaction) ?? null
}

function addInterval(date: Date, recurrence: Recurrence): Date {
  const next = new Date(date)
  if (recurrence === 'monthly') next.setMonth(next.getMonth() + 1)
  else if (recurrence === 'quarterly') next.setMonth(next.getMonth() + 3)
  else if (recurrence === 'yearly') next.setFullYear(next.getFullYear() + 1)
  return next
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10)
}

// Gera as instâncias futuras de uma transação recorrente. Exige recurrence_end_date
// para limitar a geração — sem uma data-fim não temos como saber quantas instâncias
// criar, então nesse caso apenas a transação original é criada (documentado também
// no TransactionForm, que passa a exigir a data-fim quando uma recorrência é escolhida).
function buildRecurrenceInstances(
  base: Transaction,
  userId: string,
): Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'category' | 'contact' | 'deal'>[] {
  if (base.recurrence === 'none' || !base.recurrence_end_date) return []

  const instances: Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'category' | 'contact' | 'deal'>[] = []
  const endDate = new Date(`${base.recurrence_end_date}T00:00:00`)
  let cursor = addInterval(new Date(`${base.date}T00:00:00`), base.recurrence)

  while (cursor.getTime() <= endDate.getTime()) {
    instances.push({
      user_id: userId,
      type: base.type,
      status: 'pending',
      description: base.description,
      amount: base.amount,
      date: toDateString(cursor),
      due_date: base.due_date,
      paid_at: null,
      category_id: base.category_id,
      contact_id: base.contact_id,
      deal_id: base.deal_id,
      payment_method: base.payment_method,
      recurrence: base.recurrence,
      recurrence_end_date: base.recurrence_end_date,
      receipt_url: null,
      notes: base.notes,
    })
    cursor = addInterval(cursor, base.recurrence)
  }

  return instances
}

export async function createTransaction(
  input: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'category' | 'contact' | 'deal'>,
): Promise<Transaction> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw new Error(userError.message)
  if (!userData.user) throw new Error('Usuário não autenticado.')

  const { data, error } = await supabase
    .from('transactions')
    .insert({ ...input, user_id: userData.user.id })
    .select(TRANSACTION_SELECT)
    .single()

  if (error) throw new Error(error.message)
  const created = data as unknown as Transaction

  const futureInstances = buildRecurrenceInstances(created, userData.user.id)
  if (futureInstances.length > 0) {
    const { error: batchError } = await supabase.from('transactions').insert(futureInstances)
    if (batchError) throw new Error(batchError.message)
  }

  return created
}

export async function updateTransaction(id: string, input: Partial<Transaction>): Promise<Transaction> {
  const { category: _category, contact: _contact, deal: _deal, ...updatable } = input

  const { data, error } = await supabase
    .from('transactions')
    .update(updatable)
    .eq('id', id)
    .select(TRANSACTION_SELECT)
    .single()

  if (error) throw new Error(error.message)
  return data as unknown as Transaction
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function markAsPaid(id: string, paid_at?: string): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .update({ status: 'paid', paid_at: paid_at ?? new Date().toISOString() })
    .eq('id', id)
    .select(TRANSACTION_SELECT)
    .single()

  if (error) throw new Error(error.message)
  return data as unknown as Transaction
}

const RECEIPTS_BUCKET = 'receipts'
const MAX_RECEIPT_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_RECEIPT_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

function validateReceiptFile(file: File): void {
  if (!ALLOWED_RECEIPT_TYPES.includes(file.type)) {
    throw new Error('Formato inválido. Envie um arquivo PDF, JPEG ou PNG.')
  }
  if (file.size > MAX_RECEIPT_SIZE_BYTES) {
    throw new Error('Arquivo muito grande. O limite é 5MB.')
  }
}

// Assim como em proposals.ts, guardamos o CAMINHO do arquivo em receipt_url
// (não uma URL), já que o bucket é privado e uma signed URL salva no banco
// expiraria. A URL assinada é gerada sob demanda em getSignedReceiptUrl().
export async function uploadReceipt(transactionId: string, file: File): Promise<string> {
  validateReceiptFile(file)

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw new Error(userError.message)
  if (!userData.user) throw new Error('Usuário não autenticado.')

  const path = `${userData.user.id}/${transactionId}/${file.name}`

  const { error: uploadError } = await supabase.storage.from(RECEIPTS_BUCKET).upload(path, file, { upsert: true })
  if (uploadError) throw new Error(uploadError.message)

  const { error: updateError } = await supabase
    .from('transactions')
    .update({ receipt_url: path })
    .eq('id', transactionId)
  if (updateError) throw new Error(updateError.message)

  return path
}

export async function getSignedReceiptUrl(path: string, expiresInSeconds = 300): Promise<string> {
  const { data, error } = await supabase.storage.from(RECEIPTS_BUCKET).createSignedUrl(path, expiresInSeconds)
  if (error) throw new Error(error.message)
  return data.signedUrl
}

export async function deleteReceipt(transactionId: string, receiptUrl: string): Promise<void> {
  const { error: removeError } = await supabase.storage.from(RECEIPTS_BUCKET).remove([receiptUrl])
  if (removeError) throw new Error(removeError.message)

  const { error: updateError } = await supabase
    .from('transactions')
    .update({ receipt_url: null })
    .eq('id', transactionId)
  if (updateError) throw new Error(updateError.message)
}

export async function exportTransactionsCSV(filters: Partial<TransactionFilters> = {}): Promise<string> {
  const transactions = await getTransactions(filters)
  return generateTransactionsCSV(transactions)
}
