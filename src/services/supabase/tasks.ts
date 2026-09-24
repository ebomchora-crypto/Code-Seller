import { supabase } from '@/lib/supabaseClient'
import type { Tag, Task, TaskFilters, TaskMetrics, TaskPriority, TaskRecurrence, TaskStatus } from '@/types'

const TASK_SELECT =
  '*, task_tags(tag:tags(*)), contact:contacts(id, name, email), deal:deals(id, title, stage)'

interface RawTaskTag {
  tag: Tag | null
}

interface RawTaskRow {
  id: string
  user_id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  reminder_at: string | null
  contact_id: string | null
  deal_id: string | null
  assigned_to: string | null
  recurrence: TaskRecurrence
  recurrence_end_date: string | null
  parent_task_id: string | null
  position: number
  completed_at: string | null
  created_at: string
  updated_at: string
  task_tags?: RawTaskTag[] | null
  contact?: Task['contact']
  deal?: Task['deal']
}

function mapTask(row: RawTaskRow): Task {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    due_date: row.due_date,
    reminder_at: row.reminder_at,
    contact_id: row.contact_id,
    deal_id: row.deal_id,
    assigned_to: row.assigned_to,
    recurrence: row.recurrence,
    recurrence_end_date: row.recurrence_end_date,
    parent_task_id: row.parent_task_id,
    position: row.position,
    completed_at: row.completed_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    tags: row.task_tags?.map((entry) => entry.tag).filter((tag): tag is Tag => tag !== null),
    contact: row.contact,
    deal: row.deal,
  }
}

// Busca as subtarefas de uma lista de tarefas-raiz em uma única query e as
// agrupa por parent_task_id. Evitamos depender do embed self-referencial do
// PostgREST para tasks->tasks (via parent_task_id), que é ambíguo sem o nome
// exato da constraint — uma segunda query simples e explícita é mais robusta.
async function attachSubtasks(rootTasks: Task[]): Promise<Task[]> {
  if (rootTasks.length === 0) return rootTasks

  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_SELECT)
    .in(
      'parent_task_id',
      rootTasks.map((task) => task.id),
    )
    .order('position', { ascending: true })

  if (error) throw new Error(error.message)

  const subtasksByParent = new Map<string, Task[]>()
  for (const row of (data ?? []) as unknown as RawTaskRow[]) {
    const subtask = mapTask(row)
    if (!subtask.parent_task_id) continue
    const list = subtasksByParent.get(subtask.parent_task_id) ?? []
    list.push(subtask)
    subtasksByParent.set(subtask.parent_task_id, list)
  }

  return rootTasks.map((task) => ({ ...task, subtasks: subtasksByParent.get(task.id) ?? [] }))
}

export async function getTasks(filters: Partial<TaskFilters> = {}): Promise<Task[]> {
  let query = supabase.from('tasks').select(TASK_SELECT).is('parent_task_id', null)

  if (filters.search) {
    const term = filters.search.trim()
    if (term) {
      query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`)
    }
  }
  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  if (filters.priority && filters.priority !== 'all') {
    query = query.eq('priority', filters.priority)
  }
  if (filters.contact_id) {
    query = query.eq('contact_id', filters.contact_id)
  }
  if (filters.deal_id) {
    query = query.eq('deal_id', filters.deal_id)
  }

  if (filters.due && filters.due !== 'all') {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
    const weekEnd = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000)

    if (filters.due === 'today') {
      query = query.gte('due_date', todayStart.toISOString()).lt('due_date', todayEnd.toISOString())
    } else if (filters.due === 'week') {
      query = query.gte('due_date', todayStart.toISOString()).lt('due_date', weekEnd.toISOString())
    } else if (filters.due === 'overdue') {
      query = query.lt('due_date', now.toISOString()).not('status', 'in', '(done,cancelled)')
    } else if (filters.due === 'no_date') {
      query = query.is('due_date', null)
    }
  }

  query = query.order('position', { ascending: true })

  const { data, error } = await query
  if (error) throw new Error(error.message)

  let tasks = ((data ?? []) as unknown as RawTaskRow[]).map(mapTask)

  if (filters.tag_id) {
    tasks = tasks.filter((task) => task.tags?.some((tag) => tag.id === filters.tag_id))
  }

  return attachSubtasks(tasks)
}

export async function getTaskById(id: string): Promise<Task | null> {
  const { data, error } = await supabase.from('tasks').select(TASK_SELECT).eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null

  const [task] = await attachSubtasks([mapTask(data as unknown as RawTaskRow)])
  return task
}

function addRecurrenceInterval(date: Date, recurrence: TaskRecurrence): Date {
  const next = new Date(date)
  if (recurrence === 'daily') next.setDate(next.getDate() + 1)
  else if (recurrence === 'weekly') next.setDate(next.getDate() + 7)
  else if (recurrence === 'monthly') next.setMonth(next.getMonth() + 1)
  else if (recurrence === 'yearly') next.setFullYear(next.getFullYear() + 1)
  return next
}

const MAX_RECURRENCE_INSTANCES = 52

// Gera as instâncias futuras de uma tarefa recorrente, no máximo 52 (equivalente
// a 1 ano de recorrência semanal), para evitar criar um volume descontrolado de
// linhas caso o usuário configure uma data-fim muito distante.
function buildRecurringTaskInstances(
  base: Task,
  userId: string,
): Omit<Task, 'id' | 'created_at' | 'updated_at' | 'tags' | 'contact' | 'deal' | 'subtasks'>[] {
  if (base.recurrence === 'none' || !base.recurrence_end_date || !base.due_date) return []

  const instances: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'tags' | 'contact' | 'deal' | 'subtasks'>[] = []
  const endDate = new Date(`${base.recurrence_end_date}T23:59:59`)
  let cursor = addRecurrenceInterval(new Date(base.due_date), base.recurrence)

  while (cursor.getTime() <= endDate.getTime() && instances.length < MAX_RECURRENCE_INSTANCES) {
    instances.push({
      user_id: userId,
      title: base.title,
      description: base.description,
      status: 'todo',
      priority: base.priority,
      due_date: cursor.toISOString(),
      reminder_at: base.reminder_at
        ? new Date(cursor.getTime() - (new Date(base.due_date).getTime() - new Date(base.reminder_at).getTime())).toISOString()
        : null,
      contact_id: base.contact_id,
      deal_id: base.deal_id,
      assigned_to: base.assigned_to,
      recurrence: base.recurrence,
      recurrence_end_date: base.recurrence_end_date,
      parent_task_id: null,
      position: base.position,
      completed_at: null,
    })
    cursor = addRecurrenceInterval(cursor, base.recurrence)
  }

  return instances
}

export async function createTask(
  input: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'subtasks'>,
): Promise<Task> {
  const { tags: _tags, contact: _contact, deal: _deal, ...insertable } = input

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw new Error(userError.message)
  if (!userData.user) throw new Error('Usuário não autenticado.')

  const { data, error } = await supabase
    .from('tasks')
    .insert({ ...insertable, user_id: userData.user.id })
    .select(TASK_SELECT)
    .single()

  if (error) throw new Error(error.message)
  const created = mapTask(data as unknown as RawTaskRow)

  const futureInstances = buildRecurringTaskInstances(created, userData.user.id)
  if (futureInstances.length > 0) {
    const { error: batchError } = await supabase.from('tasks').insert(futureInstances)
    if (batchError) throw new Error(batchError.message)
  }

  return created
}

export async function updateTask(id: string, input: Partial<Task>): Promise<Task> {
  const { tags: _tags, contact: _contact, deal: _deal, subtasks: _subtasks, ...updatable } = input

  const { data, error } = await supabase.from('tasks').update(updatable).eq('id', id).select(TASK_SELECT).single()
  if (error) throw new Error(error.message)
  return mapTask(data as unknown as RawTaskRow)
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function completeTask(id: string): Promise<Task> {
  const { data: currentRow, error: fetchError } = await supabase.from('tasks').select(TASK_SELECT).eq('id', id).single()
  if (fetchError) throw new Error(fetchError.message)
  const current = mapTask(currentRow as unknown as RawTaskRow)

  const { data, error } = await supabase
    .from('tasks')
    .update({ status: 'done', completed_at: new Date().toISOString() })
    .eq('id', id)
    .select(TASK_SELECT)
    .single()

  if (error) throw new Error(error.message)
  const completed = mapTask(data as unknown as RawTaskRow)

  // Ao concluir uma tarefa recorrente, criamos apenas a PRÓXIMA ocorrência
  // (diferente de createTask, que gera todas as instâncias até a data-fim de
  // uma vez) — assim a recorrência avança conforme o usuário realmente conclui.
  if (current.recurrence !== 'none' && current.due_date) {
    const { data: userData } = await supabase.auth.getUser()
    if (userData.user) {
      const nextDueDate = addRecurrenceInterval(new Date(current.due_date), current.recurrence)
      const withinEnd = !current.recurrence_end_date || nextDueDate <= new Date(`${current.recurrence_end_date}T23:59:59`)

      if (withinEnd) {
        await supabase.from('tasks').insert({
          user_id: userData.user.id,
          title: current.title,
          description: current.description,
          status: 'todo',
          priority: current.priority,
          due_date: nextDueDate.toISOString(),
          reminder_at: current.reminder_at
            ? new Date(
                nextDueDate.getTime() - (new Date(current.due_date).getTime() - new Date(current.reminder_at).getTime()),
              ).toISOString()
            : null,
          contact_id: current.contact_id,
          deal_id: current.deal_id,
          assigned_to: current.assigned_to,
          recurrence: current.recurrence,
          recurrence_end_date: current.recurrence_end_date,
          parent_task_id: null,
          position: current.position,
        })
      }
    }
  }

  return completed
}

export async function reopenTask(id: string): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update({ status: 'todo', completed_at: null })
    .eq('id', id)
    .select(TASK_SELECT)
    .single()

  if (error) throw new Error(error.message)
  return mapTask(data as unknown as RawTaskRow)
}

export async function updateTaskStatus(id: string, status: TaskStatus, position: number): Promise<void> {
  const completed_at = status === 'done' ? new Date().toISOString() : null
  const { error } = await supabase.from('tasks').update({ status, position, completed_at }).eq('id', id)
  if (error) throw new Error(error.message)
}

// Atualiza a posição de várias tarefas de uma vez. Usamos updates paralelos
// (não um upsert literal) porque um upsert exigiria reenviar todas as colunas
// obrigatórias de cada linha, que não temos disponíveis aqui — apenas id e
// position, que é tudo que muda ao reordenar.
export async function reorderTasks(updates: { id: string; position: number }[]): Promise<void> {
  const results = await Promise.all(
    updates.map(({ id, position }) => supabase.from('tasks').update({ position }).eq('id', id)),
  )
  const failed = results.find((result) => result.error)
  if (failed?.error) throw new Error(failed.error.message)
}

export async function createSubtask(parentId: string, title: string): Promise<Task> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw new Error(userError.message)
  if (!userData.user) throw new Error('Usuário não autenticado.')

  const { data, error } = await supabase
    .from('tasks')
    .insert({ user_id: userData.user.id, title, parent_task_id: parentId, status: 'todo', priority: 'medium' })
    .select(TASK_SELECT)
    .single()

  if (error) throw new Error(error.message)
  return mapTask(data as unknown as RawTaskRow)
}

export async function updateSubtask(id: string, data: Pick<Task, 'title' | 'status'>): Promise<Task> {
  const completed_at = data.status === 'done' ? new Date().toISOString() : null

  const { data: updated, error } = await supabase
    .from('tasks')
    .update({ ...data, completed_at })
    .eq('id', id)
    .select(TASK_SELECT)
    .single()

  if (error) throw new Error(error.message)
  return mapTask(updated as unknown as RawTaskRow)
}

export async function deleteSubtask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function addTagToTask(taskId: string, tagId: string): Promise<void> {
  const { error } = await supabase.from('task_tags').insert({ task_id: taskId, tag_id: tagId })
  if (error) throw new Error(error.message)
}

export async function removeTagFromTask(taskId: string, tagId: string): Promise<void> {
  const { error } = await supabase.from('task_tags').delete().eq('task_id', taskId).eq('tag_id', tagId)
  if (error) throw new Error(error.message)
}

export async function getTaskMetrics(): Promise<TaskMetrics> {
  const { data, error } = await supabase.from('tasks').select('status, due_date, completed_at').is('parent_task_id', null)
  if (error) throw new Error(error.message)

  const rows = data ?? []
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

  const pending = rows.filter((row) => row.status === 'todo' || row.status === 'in_progress').length
  const doneToday = rows.filter(
    (row) => row.completed_at && new Date(row.completed_at) >= todayStart && new Date(row.completed_at) < todayEnd,
  ).length
  const overdue = rows.filter(
    (row) =>
      row.due_date &&
      row.status !== 'done' &&
      row.status !== 'cancelled' &&
      new Date(row.due_date).getTime() < now.getTime(),
  ).length

  return { total: rows.length, pending, done_today: doneToday, overdue }
}

// Lembretes visuais — ver AppLayout.tsx.
// TODO: implementar push notifications reais (Service Worker + Supabase Edge
// Function com cron job). Esta função só cobre a verificação ao carregar o app.
export async function getUpcomingReminders(): Promise<Task[]> {
  const now = new Date()
  const in60min = new Date(now.getTime() + 60 * 60 * 1000)
  // Limite inferior de 24h só para não reexibir para sempre um lembrete antigo
  // que o usuário nunca abriu — não faz parte do requisito, é uma salvaguarda.
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_SELECT)
    .not('status', 'in', '(done,cancelled)')
    .not('reminder_at', 'is', null)
    .lte('reminder_at', in60min.toISOString())
    .gte('reminder_at', dayAgo.toISOString())

  if (error) throw new Error(error.message)
  return ((data ?? []) as unknown as RawTaskRow[]).map(mapTask)
}
