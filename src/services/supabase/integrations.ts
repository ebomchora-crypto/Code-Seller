import { supabase } from '@/lib/supabaseClient'
import type { Integration, IntegrationStatus, IntegrationType } from '@/types'

const ALL_TYPES: IntegrationType[] = ['whatsapp', 'google_calendar', 'google_contacts', 'zapier', 'webhook']

// Nenhuma integração tem uma linha no banco até o usuário conectar pela
// primeira vez — preenchemos placeholders "disconnected" em memória para os
// tipos ainda não configurados, para a UI sempre mostrar os 5 cards.
function placeholderFor(type: IntegrationType, userId: string): Integration {
  return {
    id: '',
    user_id: userId,
    type,
    status: 'disconnected',
    config: null,
    connected_at: null,
    created_at: '',
    updated_at: '',
  }
}

export async function getIntegrations(): Promise<Integration[]> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw new Error(userError.message)
  if (!userData.user) throw new Error('Usuário não autenticado.')

  const { data, error } = await supabase.from('integrations').select('*').eq('user_id', userData.user.id)
  if (error) throw new Error(error.message)

  const byType = new Map((data ?? []).map((integration) => [integration.type as IntegrationType, integration]))

  return ALL_TYPES.map((type) => byType.get(type) ?? placeholderFor(type, userData.user!.id))
}

export async function updateIntegrationStatus(
  type: IntegrationType,
  status: IntegrationStatus,
  config?: Record<string, unknown>,
): Promise<Integration> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw new Error(userError.message)
  if (!userData.user) throw new Error('Usuário não autenticado.')

  const { data, error } = await supabase
    .from('integrations')
    .upsert(
      {
        user_id: userData.user.id,
        type,
        status,
        config: config ?? null,
        connected_at: status === 'connected' ? new Date().toISOString() : null,
      },
      { onConflict: 'user_id,type' },
    )
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function disconnectIntegration(type: IntegrationType): Promise<void> {
  await updateIntegrationStatus(type, 'disconnected')
}
