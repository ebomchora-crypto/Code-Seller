import { supabase } from '@/lib/supabaseClient'
import { DEFAULT_TEMPLATES } from '@/utils/templates'
import type { MessageTemplate, TemplateCategory } from '@/types'

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw new Error(error.message)
  if (!data.user) throw new Error('Usuário não autenticado.')
  return data.user.id
}

// Na primeira vez, a conta recebe os modelos padrão (editáveis).
export async function getTemplates(): Promise<MessageTemplate[]> {
  const { data, error } = await supabase
    .from('message_templates')
    .select('*')
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  if (data && data.length > 0) return data as MessageTemplate[]

  const userId = await currentUserId()
  const { data: seeded, error: seedError } = await supabase
    .from('message_templates')
    .insert(DEFAULT_TEMPLATES.map((template, index) => ({ ...template, user_id: userId, position: index })))
    .select('*')
  if (seedError) throw new Error(seedError.message)
  return ((seeded ?? []) as MessageTemplate[]).sort((a, b) => a.position - b.position)
}

export async function createTemplate(input: { name: string; category: TemplateCategory; body: string; position: number }) {
  const userId = await currentUserId()
  const { data, error } = await supabase
    .from('message_templates')
    .insert({ ...input, user_id: userId })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as MessageTemplate
}

export async function updateTemplate(id: string, input: Partial<Pick<MessageTemplate, 'name' | 'category' | 'body' | 'position'>>) {
  const { data, error } = await supabase.from('message_templates').update(input).eq('id', id).select('*').single()
  if (error) throw new Error(error.message)
  return data as MessageTemplate
}

export async function deleteTemplate(id: string) {
  const { error } = await supabase.from('message_templates').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
