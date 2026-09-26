import { supabase } from '@/lib/supabaseClient'

export interface DealContract {
  id: string
  deal_id: string
  content: string
  details: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export async function getLatestContract(dealId: string): Promise<DealContract | null> {
  const { data, error } = await supabase
    .from('deal_contracts')
    .select('*')
    .eq('deal_id', dealId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) return null
  return data as DealContract | null
}

export async function saveContract(
  dealId: string,
  content: string,
  details: Record<string, unknown>,
  existingId?: string | null,
): Promise<DealContract> {
  if (existingId) {
    const { data, error } = await supabase
      .from('deal_contracts')
      .update({ content, details })
      .eq('id', existingId)
      .select('*')
      .single()
    if (error) throw new Error(error.message)
    return data as DealContract
  }
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('Usuário não autenticado.')
  const { data, error } = await supabase
    .from('deal_contracts')
    .insert({ user_id: userData.user.id, deal_id: dealId, content, details })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as DealContract
}
