import { supabase } from '@/lib/supabaseClient'
import type { TaskEvent, TaskEventKind } from '@/utils/taskReminders'

// Consultas dos avisos do app de Windows. Só tarefas abertas; o RLS já
// limita às tarefas do próprio usuário.
const OPEN_STATUSES = ['todo', 'in_progress']
const EVENT_SELECT = 'id, title, due_date, reminder_at, contact:contacts(name)'

interface EventRow {
  id: string
  title: string
  due_date: string | null
  reminder_at: string | null
  contact: { name: string } | null
}

function toEvent(kind: TaskEventKind) {
  return (row: EventRow): TaskEvent => ({
    taskId: row.id,
    title: row.title,
    kind,
    at: (kind === 'due' ? row.due_date : row.reminder_at) ?? '',
    dueDate: row.due_date,
    contactName: row.contact?.name ?? null,
  })
}

// Prazos e lembretes que chegaram no intervalo (since, until].
export async function getTaskEventsBetween(since: Date, until: Date): Promise<TaskEvent[]> {
  const from = since.toISOString()
  const to = until.toISOString()
  const [due, reminders] = await Promise.all([
    supabase.from('tasks').select(EVENT_SELECT).in('status', OPEN_STATUSES).gt('due_date', from).lte('due_date', to).limit(50),
    supabase
      .from('tasks')
      .select(EVENT_SELECT)
      .in('status', OPEN_STATUSES)
      .gt('reminder_at', from)
      .lte('reminder_at', to)
      .limit(50),
  ])
  if (due.error) throw new Error(due.error.message)
  if (reminders.error) throw new Error(reminders.error.message)

  return [
    ...((due.data ?? []) as unknown as EventRow[]).map(toEvent('due')),
    ...((reminders.data ?? []) as unknown as EventRow[]).map(toEvent('reminder')),
  ]
}

// Mesmo critério do "atrasadas" do Início: tarefas principais abertas com
// prazo vencido. GET com limit(1) em vez de HEAD (HEAD falha em algumas redes).
export async function countOverdueTasks(): Promise<number> {
  const { count, error } = await supabase
    .from('tasks')
    .select('id', { count: 'exact' })
    .limit(1)
    .is('parent_task_id', null)
    .in('status', OPEN_STATUSES)
    .lt('due_date', new Date().toISOString())
  if (error) throw new Error(error.message)
  return count ?? 0
}
