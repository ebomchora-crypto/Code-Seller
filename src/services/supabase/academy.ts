import { supabase } from '@/lib/supabaseClient'

export async function getAcademyProgress(): Promise<Set<string>> {
  const { data, error } = await supabase.from('academy_progress').select('item_id')
  if (error) throw new Error(error.message)
  return new Set((data ?? []).map((row: { item_id: string }) => row.item_id))
}

export async function setAcademyItems(itemIds: string[], done: boolean): Promise<void> {
  if (itemIds.length === 0) return
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('Usuário não autenticado.')
  const userId = userData.user.id

  if (done) {
    const { error } = await supabase
      .from('academy_progress')
      .upsert(
        itemIds.map((itemId) => ({ user_id: userId, item_id: itemId })),
        { onConflict: 'user_id,item_id', ignoreDuplicates: true },
      )
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase.from('academy_progress').delete().eq('user_id', userId).in('item_id', itemIds)
    if (error) throw new Error(error.message)
  }
}
