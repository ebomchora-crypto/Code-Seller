import { supabase } from '@/lib/supabaseClient'
import { createTransaction } from '@/services/supabase/transactions'
import type { PaymentMethod, Receivable, ReceivableStatus, Transaction } from '@/types'

const RECEIVABLE_SELECT = '*, deal:deals(id, title, value), contact:contacts(id, name), transaction:transactions(id, description)'

export async function getReceivables(status: ReceivableStatus | 'all' = 'all'): Promise<Receivable[]> {
  let query = supabase.from('receivables').select(RECEIVABLE_SELECT).order('due_date', { ascending: true })
  if (status !== 'all') query = query.eq('status', status)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as Receivable[]
}

export async function createReceivable(
  input: Omit<Receivable, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deal' | 'contact' | 'transaction'>,
): Promise<Receivable> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw new Error(userError.message)
  if (!userData.user) throw new Error('Usuário não autenticado.')

  const { data, error } = await supabase
    .from('receivables')
    .insert({ ...input, user_id: userData.user.id })
    .select(RECEIVABLE_SELECT)
    .single()

  if (error) throw new Error(error.message)
  return data as unknown as Receivable
}

export interface MarkReceivableAsPaidResult {
  receivable: Receivable
  transaction: Transaction
}

export async function markReceivableAsPaid(
  id: string,
  paymentMethod: PaymentMethod,
  paid_at?: string,
  notes?: string,
): Promise<MarkReceivableAsPaidResult> {
  const { data: receivableRow, error: fetchError } = await supabase
    .from('receivables')
    .select(RECEIVABLE_SELECT)
    .eq('id', id)
    .single()

  if (fetchError) throw new Error(fetchError.message)
  const receivable = receivableRow as unknown as Receivable

  const paidAtIso = paid_at ?? new Date().toISOString()

  // A transaction precisa existir antes de vincularmos seu id ao receivable,
  // então as duas escritas têm uma dependência de ordem real e não podem ser
  // literalmente paralelizadas com Promise.all — ainda assim, ambas fazem
  // parte da mesma operação lógica de "marcar como pago".
  const transaction = await createTransaction({
    type: 'income',
    status: 'paid',
    description: receivable.description,
    amount: receivable.amount,
    date: paidAtIso.slice(0, 10),
    due_date: receivable.due_date,
    paid_at: paidAtIso,
    category_id: null,
    contact_id: receivable.contact_id,
    deal_id: receivable.deal_id,
    payment_method: paymentMethod,
    recurrence: 'none',
    recurrence_end_date: null,
    receipt_url: null,
    notes: notes || receivable.notes,
  })

  const { data: updatedRow, error: updateError } = await supabase
    .from('receivables')
    .update({ status: 'paid', paid_at: paidAtIso, transaction_id: transaction.id })
    .eq('id', id)
    .select(RECEIVABLE_SELECT)
    .single()

  if (updateError) throw new Error(updateError.message)

  return { receivable: updatedRow as unknown as Receivable, transaction }
}

export async function cancelReceivable(id: string): Promise<void> {
  const { error } = await supabase.from('receivables').update({ status: 'cancelled' }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function updateDueDate(id: string, due_date: string): Promise<Receivable> {
  const { data, error } = await supabase
    .from('receivables')
    .update({ due_date })
    .eq('id', id)
    .select(RECEIVABLE_SELECT)
    .single()

  if (error) throw new Error(error.message)
  return data as unknown as Receivable
}
