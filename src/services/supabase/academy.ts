import { supabase } from '@/lib/supabaseClient'

// Usuário da sessão já aberta, sem ir ao servidor (getUser() faz uma chamada
// a cada clique e, se ela falhasse, o progresso não era salvo).
async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  const id = data.session?.user.id
  if (id) return id
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('Sua sessão expirou. Entre novamente para salvar o progresso.')
  return userData.user.id
}

export async function getAcademyProgress(): Promise<Set<string>> {
  const { data, error } = await supabase.from('academy_progress').select('item_id')
  if (error) throw new Error(error.message)
  return new Set((data ?? []).map((row: { item_id: string }) => row.item_id))
}

export async function setAcademyItems(itemIds: string[], done: boolean): Promise<void> {
  if (itemIds.length === 0) return
  const userId = await currentUserId()

  if (done) {
    const { error } = await supabase
      .from('academy_progress')
      .upsert(
        itemIds.map((itemId) => ({ user_id: userId, item_id: itemId })),
        { onConflict: 'user_id,item_id', ignoreDuplicates: true },
      )
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase.from('academy_progress').delete().eq('user_id', userId).in('item_id', itemIds)
    if (error) throw new Error(error.message)
  }
}

// Respostas dos exercícios das lições.
export async function getAcademyAnswer(lessonId: string): Promise<string> {
  const { data, error } = await supabase.from('academy_answers').select('answer').eq('lesson_id', lessonId).maybeSingle()
  if (error) throw new Error(error.message)
  return (data as { answer: string } | null)?.answer ?? ''
}

export async function saveAcademyAnswer(lessonId: string, answer: string): Promise<void> {
  const userId = await currentUserId()
  const { error } = await supabase
    .from('academy_answers')
    .upsert({ user_id: userId, lesson_id: lessonId, answer: answer.slice(0, 4000), updated_at: new Date().toISOString() }, { onConflict: 'user_id,lesson_id' })
  if (error) throw new Error(error.message)
}
