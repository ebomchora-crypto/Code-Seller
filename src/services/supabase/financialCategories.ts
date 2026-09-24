import { supabase } from '@/lib/supabaseClient'
import type { FinancialCategory, TransactionType } from '@/types'

export async function getCategories(type?: TransactionType): Promise<FinancialCategory[]> {
  let query = supabase.from('financial_categories').select('*').order('name', { ascending: true })
  if (type) query = query.eq('type', type)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createCategory(
  input: Omit<FinancialCategory, 'id' | 'user_id' | 'created_at'>,
): Promise<FinancialCategory> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw new Error(userError.message)
  if (!userData.user) throw new Error('Usuário não autenticado.')

  const { data, error } = await supabase
    .from('financial_categories')
    .insert({ ...input, user_id: userData.user.id })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updateCategory(id: string, input: Partial<FinancialCategory>): Promise<FinancialCategory> {
  const { data, error } = await supabase
    .from('financial_categories')
    .update(input)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('financial_categories').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// Popula categorias padrão para o usuário autenticado (RPC definida em
// 0004_financial.sql). Chamado uma vez pelo hook quando o usuário ainda não
// tem nenhuma categoria — evita que ele precise editar SQL manualmente.
export async function seedDefaultCategories(): Promise<void> {
  const { error } = await supabase.rpc('seed_default_financial_categories')
  if (error) throw new Error(error.message)
}
