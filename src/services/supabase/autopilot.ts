import { supabase } from '@/lib/supabaseClient'
import type { ActionStatus, AutoPilotConversation, AutoPilotMessage, ProposedAction } from '@/types'

export async function getConversations(): Promise<AutoPilotConversation[]> {
  const { data, error } = await supabase
    .from('autopilot_conversations')
    .select('*')
    .order('updated_at', { ascending: false })

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
    .order('created_at', { ascending: true })

  if (messagesError) throw new Error(messagesError.message)

  return { ...conversation, messages: (messages ?? []) as AutoPilotMessage[] }
}

export async function createConversation(title = 'Nova conversa'): Promise<AutoPilotConversation> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw new Error(userError.message)
  if (!userData.user) throw new Error('Usuário não autenticado.')

  const { data, error } = await supabase
    .from('autopilot_conversations')
    .insert({ title, user_id: userData.user.id })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data
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
  const { data: message, error: fetchError } = await supabase
    .from('autopilot_messages')
    .select('actions')
    .eq('id', messageId)
    .single()

  if (fetchError) throw new Error(fetchError.message)

  const actions = ((message.actions ?? []) as ProposedAction[]).map((action, index) =>
    index === actionIndex ? { ...action, status } : action,
  )

  const { error: updateError } = await supabase.from('autopilot_messages').update({ actions }).eq('id', messageId)
  if (updateError) throw new Error(updateError.message)
}
