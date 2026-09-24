import { supabase } from '@/lib/supabaseClient'
import type { NotificationPreferences } from '@/types'

async function getCurrentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw new Error(error.message)
  if (!data.user) throw new Error('Usuário não autenticado.')
  return data.user.id
}

// A função handle_new_user (SQL) cria a linha padrão automaticamente para
// novos cadastros. Este fallback cobre usuários criados antes dessa migração.
export async function getNotificationPreferences(): Promise<NotificationPreferences | null> {
  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (data) return data

  const { data: created, error: createError } = await supabase
    .from('notification_preferences')
    .upsert({ user_id: userId }, { onConflict: 'user_id' })
    .select('*')
    .single()

  if (createError) throw new Error(createError.message)
  return created
}

export async function updateNotificationPreferences(
  data: Partial<NotificationPreferences>,
): Promise<NotificationPreferences> {
  const userId = await getCurrentUserId()

  const { data: updated, error } = await supabase
    .from('notification_preferences')
    .update(data)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return updated
}
