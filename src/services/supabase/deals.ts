import { supabase } from '@/lib/supabaseClient'
import { createReceivable } from '@/services/supabase/receivables'
import { getStageConfig } from '@/utils/deals'
import type { Deal, DealFilters, DealStage, DealStatus } from '@/types'

const DEAL_LIST_SELECT = '*, contact:contacts(id, name, email, phone)'
const DEAL_DETAIL_SELECT = '*, contact:contacts(id, name, email, phone), activities:deal_activities(*)'

// Quando um deal muda para status 'won', criamos automaticamente uma conta a
// receber (receivables) com os dados do negócio. Isso é feito aqui, no
// frontend, por simplicidade neste MVP. Em produção, isso deveria ser um
// trigger PostgreSQL ou uma Supabase Edge Function, para garantir consistência
// mesmo em atualizações feitas diretamente no banco (fora do frontend).
// Falhas aqui não devem impedir a atualização do deal em si — por isso o
// erro é apenas logado, não propagado.
async function createReceivableIfWon(previousStatus: DealStatus | undefined, deal: Deal): Promise<void> {
  if (!previousStatus || previousStatus === 'won' || deal.status !== 'won') return
  if (!deal.value || deal.value <= 0) return

  try {
    await createReceivable({
      deal_id: deal.id,
      contact_id: deal.contact_id,
      description: deal.title,
      amount: deal.value,
      due_date: deal.expected_close_date,
      status: 'pending',
      paid_at: null,
      transaction_id: null,
      notes: null,
    })
  } catch (err) {
    console.error('Não foi possível criar a conta a receber automaticamente para o negócio ganho:', err)
  }
}

export interface GetDealsResult {
  data: Deal[]
  count: number
}

export async function getDeals(filters: Partial<DealFilters> = {}): Promise<GetDealsResult> {
  let query = supabase.from('deals').select(DEAL_LIST_SELECT, { count: 'exact' })

  if (filters.search) {
    const term = filters.search.trim()
    if (term) {
      // Busca por título/serviço direto na tabela, mais por contatos cujo nome combine
      // (join filtrado à parte, já que o PostgREST não faz OR entre tabelas diferentes).
      const { data: matchingContacts } = await supabase
        .from('contacts')
        .select('id')
        .ilike('name', `%${term}%`)

      const contactIds = (matchingContacts ?? []).map((row) => row.id)
      const orParts = [`title.ilike.%${term}%`, `service.ilike.%${term}%`]
      if (contactIds.length > 0) {
        orParts.push(`contact_id.in.(${contactIds.join(',')})`)
      }
      query = query.or(orParts.join(','))
    }
  }
  if (filters.stage && filters.stage !== 'all') {
    query = query.eq('stage', filters.stage)
  }
  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  if (filters.origin) {
    query = query.eq('origin', filters.origin)
  }
  if (filters.service) {
    query = query.eq('service', filters.service)
  }

  query = query.order('created_at', { ascending: false })

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  const deals = (data ?? []) as unknown as Deal[]
  return { data: deals, count: count ?? deals.length }
}

export async function getDealById(id: string): Promise<Deal | null> {
  const { data, error } = await supabase
    .from('deals')
    .select(DEAL_DETAIL_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  const deal = data as unknown as Deal
  deal.activities = [...(deal.activities ?? [])].sort(
    (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
  )
  return deal
}

export async function createDeal(
  input: Omit<Deal, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'contact' | 'activities'>,
): Promise<Deal> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw new Error(userError.message)
  if (!userData.user) throw new Error('Usuário não autenticado.')

  const { data, error } = await supabase
    .from('deals')
    .insert({ ...input, user_id: userData.user.id })
    .select(DEAL_LIST_SELECT)
    .single()

  if (error) throw new Error(error.message)
  return data as unknown as Deal
}

export async function updateDeal(id: string, input: Partial<Deal>): Promise<Deal> {
  const { contact: _contact, activities: _activities, ...updatable } = input

  const { data: previousRow } = await supabase.from('deals').select('status').eq('id', id).single()
  const previousStatus = (previousRow?.status as DealStatus | undefined) ?? undefined

  const { data, error } = await supabase
    .from('deals')
    .update(updatable)
    .eq('id', id)
    .select(DEAL_LIST_SELECT)
    .single()

  if (error) throw new Error(error.message)
  const deal = data as unknown as Deal

  await createReceivableIfWon(previousStatus, deal)

  return deal
}

export async function deleteDeal(id: string): Promise<void> {
  const { error } = await supabase.from('deals').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function updateDealStage(
  id: string,
  stage: DealStage,
  previousStage: DealStage,
): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw new Error(userError.message)
  if (!userData.user) throw new Error('Usuário não autenticado.')

  const previousStatus: DealStatus = previousStage === 'won' ? 'won' : previousStage === 'lost' ? 'lost' : 'open'
  const nextStatus = stage === 'won' ? 'won' : stage === 'lost' ? 'lost' : 'open'

  const { data, error } = await supabase
    .from('deals')
    .update({ stage, status: nextStatus, probability: getStageConfig(stage).default_probability })
    .eq('id', id)
    .select(DEAL_LIST_SELECT)
    .single()

  if (error) throw new Error(error.message)

  const { error: activityError } = await supabase.from('deal_activities').insert({
    deal_id: id,
    user_id: userData.user.id,
    type: 'stage_change',
    content: `Etapa alterada de "${getStageConfig(previousStage).label}" para "${getStageConfig(stage).label}".`,
    metadata: { from: previousStage, to: stage },
  })

  if (activityError) throw new Error(activityError.message)

  await createReceivableIfWon(previousStatus, data as unknown as Deal)
}

// Serviço mínimo usado pelo módulo CRM para vincular negócios existentes a um contato.
export async function getUnlinkedDeals(): Promise<Deal[]> {
  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .is('contact_id', null)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as Deal[]
}

export async function linkDealToContact(dealId: string, contactId: string): Promise<Deal> {
  const { data, error } = await supabase
    .from('deals')
    .update({ contact_id: contactId })
    .eq('id', dealId)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data as unknown as Deal
}
