import { supabase } from '@/lib/supabaseClient'
import type { PipelineStage } from '@/types'

export async function getPipelineStages(): Promise<PipelineStage[]> {
  const { data, error } = await supabase.from('pipeline_stages').select('*').order('position', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createPipelineStage(
  data: Omit<PipelineStage, 'id' | 'user_id' | 'created_at'>,
): Promise<PipelineStage> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw new Error(userError.message)
  if (!userData.user) throw new Error('Usuário não autenticado.')

  const { data: stage, error } = await supabase
    .from('pipeline_stages')
    .insert({ ...data, user_id: userData.user.id })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return stage
}

export async function updatePipelineStage(id: string, data: Partial<PipelineStage>): Promise<PipelineStage> {
  const { data: stage, error } = await supabase
    .from('pipeline_stages')
    .update(data)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return stage
}

// Impede a exclusão de uma etapa em uso, já que os deals atuais ainda usam as
// etapas fixas de src/utils/deals.ts (não esta tabela) — a checagem aqui é
// apenas por segurança para quando a migração completa acontecer.
export async function deletePipelineStage(id: string): Promise<void> {
  const { error } = await supabase.from('pipeline_stages').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// Updates em paralelo (não upsert literal, que exigiria o payload completo de
// cada linha) — mesmo padrão usado em reorderTasks.
export async function reorderPipelineStages(updates: { id: string; position: number }[]): Promise<void> {
  const results = await Promise.all(
    updates.map(({ id, position }) => supabase.from('pipeline_stages').update({ position }).eq('id', id)),
  )
  const failed = results.find((result) => result.error)
  if (failed?.error) throw new Error(failed.error.message)
}
