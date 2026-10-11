import { supabase } from '@/lib/supabaseClient'
import type { ClientSubscription, SubscriptionDraft, SubscriptionStatus } from '@/types'

const SELECT = '*, contact:contacts(id, name), deal:deals(id, title)'

export async function getSubscriptions(filter: { contactId?: string; dealId?: string; activeOnly?: boolean } = {}): Promise<ClientSubscription[]> {
  let query = supabase.from('client_subscriptions').select(SELECT).order('created_at', { ascending: false })
  if (filter.contactId) query = query.eq('contact_id', filter.contactId)
  if (filter.dealId) query = query.eq('deal_id', filter.dealId)
  if (filter.activeOnly) query = query.eq('status', 'active')
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as ClientSubscription[]
}

// Cria as cobranças dos próximos vencimentos no Financeiro ("A receber"). O servidor também faz isso todo dia.
async function refreshIndex(): Promise<void> {
  const { refreshSubscriptionIndex } = await import('@/hooks/useSubscriptionIndex')
  await refreshSubscriptionIndex()
}

export async function generateMyCharges(): Promise<void> {
  const { error } = await supabase.rpc('generate_my_subscription_charges')
  if (error) console.error('Não foi possível gerar as cobranças da mensalidade:', error.message)
}

interface SyncTarget {
  dealId?: string | null
  contactId?: string | null
  currency: string
  existing?: ClientSubscription | null
}

/** Grava o que o formulário pediu: liga, muda ou cancela a mensalidade do negócio/contato. */
export async function syncSubscription(draft: SubscriptionDraft, target: SyncTarget): Promise<ClientSubscription | null> {
  const { existing } = target
  if (!draft.enabled) {
    if (existing && existing.status !== 'canceled') await setSubscriptionStatus(existing.id, 'canceled')
    return null
  }
  const fields = {
    title: draft.title.trim() || 'Mensalidade',
    amount: Number(draft.amount),
    currency: target.currency,
    start_date: draft.startDate,
    months: draft.months ? Number(draft.months) : null,
    payment_method: draft.paymentMethod || null,
    notes: draft.notes.trim() || null,
    contact_id: target.contactId ?? existing?.contact_id ?? null,
    deal_id: target.dealId ?? existing?.deal_id ?? null,
  }
  let saved: ClientSubscription
  if (existing) {
    const { data, error } = await supabase
      .from('client_subscriptions')
      .update({ ...fields, status: existing.status === 'canceled' ? 'active' : existing.status })
      .eq('id', existing.id)
      .select(SELECT)
      .single()
    if (error) throw new Error(error.message)
    saved = data as unknown as ClientSubscription
  } else {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) throw new Error(userError.message)
    if (!userData.user) throw new Error('Usuário não autenticado.')
    const { data, error } = await supabase
      .from('client_subscriptions')
      .insert({ ...fields, user_id: userData.user.id })
      .select(SELECT)
      .single()
    if (error) throw new Error(error.message)
    saved = data as unknown as ClientSubscription
  }
  await generateMyCharges()
  void refreshIndex()
  return saved
}

export async function setSubscriptionStatus(id: string, status: SubscriptionStatus): Promise<void> {
  const { error } = await supabase.from('client_subscriptions').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
  if (status === 'active') await generateMyCharges()
  void refreshIndex()
}

export async function deleteSubscription(id: string): Promise<void> {
  const { error } = await supabase.from('client_subscriptions').delete().eq('id', id)
  if (error) throw new Error(error.message)
  void refreshIndex()
}
