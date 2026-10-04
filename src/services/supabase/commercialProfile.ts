import { supabase } from '@/lib/supabaseClient'
import type { CommercialProfile } from '@/types/commercialProfile'
import { EMPTY_COMMERCIAL_PROFILE, normalizeCommercialProfile } from '@/utils/commercialProfile'

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw new Error(error.message)
  if (!data.user) throw new Error('Usuário não autenticado.')
  return data.user.id
}

const COLUMNS = 'services, packages, differentials, niches, results, winning_messages, writing_style, signature, updated_at'

// Perfil comercial da conta (vazio se ainda não foi preenchido).
export async function getCommercialProfile(): Promise<CommercialProfile> {
  const { data, error } = await supabase.from('commercial_profiles').select(COLUMNS).maybeSingle()
  if (error) throw new Error(error.message)
  return data ? normalizeCommercialProfile(data) : { ...EMPTY_COMMERCIAL_PROFILE }
}

export async function saveCommercialProfile(profile: CommercialProfile): Promise<CommercialProfile> {
  const userId = await currentUserId()
  const clean = normalizeCommercialProfile(profile)
  const { updated_at: _updatedAt, ...fields } = clean
  const { data, error } = await supabase
    .from('commercial_profiles')
    .upsert({ ...fields, user_id: userId }, { onConflict: 'user_id' })
    .select(COLUMNS)
    .single()
  if (error) throw new Error(error.message)
  return normalizeCommercialProfile(data)
}
