import { supabase } from '@/lib/supabaseClient'
import type { ActionStatus, AutoPilotConversation, AutoPilotMessage } from '@/types'

export async function getConversations(contactId?: string): Promise<AutoPilotConversation[]> {
  let query = supabase
    .from('autopilot_conversations')
    .select('*')
    .order('updated_at', { ascending: false })
  query = contactId ? query.eq('contact_id', contactId) : query.is('contact_id', null)
  const { data, error } = await query

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getConversationById(id: string): Promise<AutoPilotConversation | null> {
  const { data: conversation, error } = await supabase
    .from('autopilot_conversations')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!conversation) return null

  const { data: messages, error: messagesError } = await supabase
    .from('autopilot_messages')
    .select('*')
    .eq('conversation_id', id)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(100)

  if (messagesError) throw new Error(messagesError.message)

  return { ...conversation, messages: ((messages ?? []) as AutoPilotMessage[]).reverse() }
}

export async function getOlderConversationMessages(conversationId: string, before: AutoPilotMessage): Promise<AutoPilotMessage[]> {
  const { data, error } = await supabase.from('autopilot_messages').select('*').eq('conversation_id', conversationId)
    .or(`created_at.lt.${before.created_at},and(created_at.eq.${before.created_at},id.lt.${before.id})`)
    .order('created_at', { ascending: false }).order('id', { ascending: false }).limit(100)
  if (error) throw new Error(error.message)
  return ((data ?? []) as AutoPilotMessage[]).reverse()
}

export async function createConversation(title = 'Nova conversa', contactId?: string, preferences?: AutoPilotConversation['preferences']): Promise<AutoPilotConversation> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw new Error(userError.message)
  if (!userData.user) throw new Error('Usuário não autenticado.')

  const { data, error } = await supabase
    .from('autopilot_conversations')
    .insert({ title, user_id: userData.user.id, contact_id: contactId ?? null, preferences: preferences ?? null })
    .select('*')
    .single()

  if (error?.code === '23505' && contactId) {
    const [existing] = await getConversations(contactId)
    if (existing) return existing
  }
  if (error) throw new Error(error.message)
  return data
}

export async function updateConversationPreferences(id: string, preferences: NonNullable<AutoPilotConversation['preferences']>): Promise<void> {
  const { error } = await supabase.from('autopilot_conversations').update({ preferences }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function updateCommercialMemory(id: string, commercialMemory: string): Promise<void> {
  const { error } = await supabase.from('autopilot_conversations').update({ commercial_memory: commercialMemory }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function claimAction(messageId: string, actionIndex: number): Promise<boolean> {
  const { data, error } = await supabase.rpc('claim_copilot_action', { p_message_id: messageId, p_index: actionIndex })
  if (error) throw new Error(error.message)
  return data === true
}

export async function updateConversationTitle(id: string, title: string): Promise<void> {
  const { error } = await supabase.from('autopilot_conversations').update({ title }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteConversation(id: string): Promise<void> {
  const { error } = await supabase.from('autopilot_conversations').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function saveMessage(data: Omit<AutoPilotMessage, 'id' | 'created_at'>): Promise<AutoPilotMessage> {
  const { data: saved, error } = await supabase.from('autopilot_messages').insert(data).select('*').single()
  if (error) throw new Error(error.message)
  return saved as AutoPilotMessage
}

export async function updateActionStatus(
  messageId: string,
  actionIndex: number,
  status: ActionStatus,
): Promise<void> {
  const { data, error } = await supabase.rpc('set_copilot_action_status', {
    p_message_id: messageId, p_index: actionIndex, p_status: status,
  })
  if (error) throw new Error(error.message)
  if (data !== true) throw new Error('O estado desta ação mudou. Atualize a conversa.')
}
