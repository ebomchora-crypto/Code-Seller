import { supabase } from '@/lib/supabaseClient'
import type { Interaction } from '@/types'

export async function getInteractionsByContact(contactId: string): Promise<Interaction[]> {
  const { data, error } = await supabase
    .from('interactions')
    .select('*')
    .eq('contact_id', contactId)
    .order('occurred_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createInteraction(
  input: Omit<Interaction, 'id' | 'user_id' | 'created_at'>,
): Promise<Interaction> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw new Error(userError.message)
  if (!userData.user) throw new Error('Usuário não autenticado.')

  const { data, error } = await supabase
    .from('interactions')
    .insert({ ...input, user_id: userData.user.id })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function deleteInteraction(id: string): Promise<void> {
  const { error } = await supabase.from('interactions').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
