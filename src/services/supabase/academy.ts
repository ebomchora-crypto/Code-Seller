import { supabase } from '@/lib/supabaseClient'

export async function getAcademyProgress(): Promise<Set<string>> {
  const { data, error } = await supabase.from('academy_progress').select('item_id')
  if (error) throw new Error(error.message)
  return new Set((data ?? []).map((row: { item_id: string }) => row.item_id))
}

export async function setAcademyItem(itemId: string, done: boolean): Promise<void> {
  if (done) {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) throw new Error('Usuário não autenticado.')
    const { error } = await supabase
      .from('academy_progress')
      .upsert({ user_id: userData.user.id, item_id: itemId }, { onConflict: 'user_id,item_id', ignoreDuplicates: true })
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase.from('academy_progress').delete().eq('item_id', itemId)
    if (error) throw new Error(error.message)
  }
}
