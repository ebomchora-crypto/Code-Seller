import { supabase } from '@/lib/supabaseClient'
import type { CRMStatus } from '@/types'

export async function getCRMStatuses(): Promise<CRMStatus[]> {
  const { data, error } = await supabase.from('crm_statuses').select('*').order('position', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createCRMStatus(data: Omit<CRMStatus, 'id' | 'user_id' | 'created_at'>): Promise<CRMStatus> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw new Error(userError.message)
  if (!userData.user) throw new Error('Usuário não autenticado.')

  const { data: status, error } = await supabase
    .from('crm_statuses')
    .insert({ ...data, user_id: userData.user.id })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return status
}

export async function updateCRMStatus(id: string, data: Partial<CRMStatus>): Promise<CRMStatus> {
  const { data: status, error } = await supabase.from('crm_statuses').update(data).eq('id', id).select('*').single()
  if (error) throw new Error(error.message)
  return status
}

// Assim como em pipeline_stages, o CRM atual ainda usa os status fixos de
// src/types/crm.ts (não esta tabela) — a checagem de uso é uma preparação
// para quando a migração completa acontecer.
export async function deleteCRMStatus(id: string): Promise<void> {
  const { error } = await supabase.from('crm_statuses').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function reorderCRMStatuses(updates: { id: string; position: number }[]): Promise<void> {
  const results = await Promise.all(
    updates.map(({ id, position }) => supabase.from('crm_statuses').update({ position }).eq('id', id)),
  )
  const failed = results.find((result) => result.error)
  if (failed?.error) throw new Error(failed.error.message)
}
