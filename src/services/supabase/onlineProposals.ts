import { supabase } from '@/lib/supabaseClient'
import type { OnlineProposal, ProposalOption, ProposalResponseError, PublicProposal } from '@/types'

export interface CreateOnlineProposalInput {
  deal_id: string
  title: string
  client_name: string | null
  body: string
  options: ProposalOption[]
  payment_terms: string | null
  valid_until: string | null
}

export async function getOnlineProposals(dealId: string): Promise<OnlineProposal[]> {
  const { data, error } = await supabase
    .from('online_proposals')
    .select('*')
    .eq('deal_id', dealId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as OnlineProposal[]
}

export async function createOnlineProposal(input: CreateOnlineProposalInput): Promise<OnlineProposal> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('Usuário não autenticado.')
  const { data, error } = await supabase
    .from('online_proposals')
    .insert({ ...input, user_id: userData.user.id })
    .select('*')
    .single()
  if (error) throw new Error(error.message)

  // Registro no histórico do negócio (falha aqui não desfaz a proposta).
  await supabase
    .from('deal_activities')
    .insert({
      deal_id: input.deal_id,
      user_id: userData.user.id,
      type: 'proposal_sent',
      content: `Proposta online criada: "${input.title}".`,
      metadata: { online_proposal_id: (data as OnlineProposal).id },
    })
    .then(({ error: activityError }) => activityError && console.error(activityError))

  return data as OnlineProposal
}

export async function cancelOnlineProposal(id: string): Promise<void> {
  const { error } = await supabase.from('online_proposals').update({ status: 'cancelled' }).eq('id', id)
  if (error) throw new Error(error.message)
}

// ---- Página pública (sem login), sempre pelo token ----

export async function getPublicProposal(token: string): Promise<PublicProposal | { status: 'cancelled' } | null> {
  const { data, error } = await supabase.rpc('get_online_proposal', { p_token: token })
  if (error) throw new Error(error.message)
  return data as PublicProposal | { status: 'cancelled' } | null
}

export async function registerProposalView(token: string): Promise<void> {
  await supabase.rpc('mark_online_proposal_viewed', { p_token: token })
}

export async function respondToProposal(input: {
  token: string
  approve: boolean
  optionId: string | null
  name: string
  note: string
}): Promise<{ ok: true; status: 'approved' | 'declined' } | { error: ProposalResponseError }> {
  const { data, error } = await supabase.rpc('respond_online_proposal', {
    p_token: input.token,
    p_approve: input.approve,
    p_option_id: input.optionId,
    p_name: input.name,
    p_note: input.note,
  })
  if (error) throw new Error(error.message)
  return data as { ok: true; status: 'approved' | 'declined' } | { error: ProposalResponseError }
}
