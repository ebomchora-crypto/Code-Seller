import { supabase } from '@/lib/supabaseClient'
import type { DealActivity } from '@/types'

export async function getActivitiesByDeal(dealId: string): Promise<DealActivity[]> {
  const { data, error } = await supabase
    .from('deal_activities')
    .select('*')
    .eq('deal_id', dealId)
    .order('occurred_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createActivity(
  input: Omit<DealActivity, 'id' | 'user_id' | 'created_at'>,
): Promise<DealActivity> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw new Error(userError.message)
  if (!userData.user) throw new Error('Usuário não autenticado.')

  const { data, error } = await supabase
    .from('deal_activities')
    .insert({ ...input, user_id: userData.user.id })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function deleteActivity(id: string): Promise<void> {
  // Atividades de mudança de etapa são registros automáticos do sistema e não
  // podem ser apagadas pelo usuário — bloqueado aqui além da UI.
  const { data: activity, error: fetchError } = await supabase
    .from('deal_activities')
    .select('type')
    .eq('id', id)
    .single()

  if (fetchError) throw new Error(fetchError.message)
  if (activity.type === 'stage_change') {
    throw new Error('Registros de mudança de etapa não podem ser removidos.')
  }

  const { error } = await supabase.from('deal_activities').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
