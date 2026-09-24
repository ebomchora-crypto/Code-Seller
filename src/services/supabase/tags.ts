import { supabase } from '@/lib/supabaseClient'
import type { Tag } from '@/types'

export async function getTags(): Promise<Tag[]> {
  const { data, error } = await supabase.from('tags').select('*').order('name', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createTag(name: string, color: string): Promise<Tag> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw new Error(userError.message)
  if (!userData.user) throw new Error('Usuário não autenticado.')

  const { data, error } = await supabase
    .from('tags')
    .insert({ name, color, user_id: userData.user.id })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function deleteTag(id: string): Promise<void> {
  const { error } = await supabase.from('tags').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function addTagToContact(contactId: string, tagId: string): Promise<void> {
  const { error } = await supabase.from('contact_tags').insert({ contact_id: contactId, tag_id: tagId })
  if (error) throw new Error(error.message)
}

export async function removeTagFromContact(contactId: string, tagId: string): Promise<void> {
  const { error } = await supabase
    .from('contact_tags')
    .delete()
    .eq('contact_id', contactId)
    .eq('tag_id', tagId)
  if (error) throw new Error(error.message)
}
