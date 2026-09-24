import type { Task, TaskPriority, TaskStatus } from '@/types'

export const TASK_STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; color: string; bg: string; icon: string }
> = {
  todo: { label: 'A Fazer', color: '#6366f1', bg: '#eef2ff', icon: 'Circle' },
  in_progress: { label: 'Em Andamento', color: '#f59e0b', bg: '#fffbeb', icon: 'Clock' },
  done: { label: 'Concluído', color: '#22c55e', bg: '#f0fdf4', icon: 'CheckCircle' },
  cancelled: { label: 'Cancelado', color: '#9ca3af', bg: '#f9fafb', icon: 'XCircle' },
}

export const TASK_PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; icon: string }> = {
  low: { label: 'Baixa', color: '#6b7280', icon: 'ArrowDown' },
  medium: { label: 'Média', color: '#3b82f6', icon: 'ArrowRight' },
  high: { label: 'Alta', color: '#f59e0b', icon: 'ArrowUp' },
  urgent: { label: 'Urgente', color: '#ef4444', icon: 'AlertCircle' },
}

export const TASK_RECURRENCE_LABELS = {
  none: 'Sem recorrência',
  daily: 'Diária',
  weekly: 'Semanal',
  monthly: 'Mensal',
  yearly: 'Anual',
} as const

const PRIORITY_ORDER: Record<TaskPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 }

export function isTaskOverdue(task: Task): boolean {
  if (!task.due_date || task.status === 'done' || task.status === 'cancelled') return false
  return new Date(task.due_date).getTime() < Date.now()
}

export function isTaskDueToday(task: Task): boolean {
  if (!task.due_date) return false
  const due = new Date(task.due_date)
  const today = new Date()
  return (
    due.getFullYear() === today.getFullYear() &&
    due.getMonth() === today.getMonth() &&
    due.getDate() === today.getDate()
  )
}

export interface DueDateDisplay {
  label: string
  variant: 'overdue' | 'today' | 'soon' | 'normal' | 'none' | 'completed'
}

export function formatTaskDueDate(due_date: string | null, completed_at?: string | null): DueDateDisplay {
  if (completed_at) {
    return {
      label: `Concluída em ${new Date(completed_at).toLocaleDateString('pt-BR')}`,
      variant: 'completed',
    }
  }

  if (!due_date) return { label: '', variant: 'none' }

  const due = new Date(due_date)
  const now = new Date()
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffDays = Math.round((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    const daysAgo = Math.abs(diffDays)
    return { label: `Venceu há ${daysAgo} ${daysAgo === 1 ? 'dia' : 'dias'}`, variant: 'overdue' }
  }
  if (diffDays === 0) return { label: 'Vence hoje', variant: 'today' }
  if (diffDays === 1) return { label: 'Vence amanhã', variant: 'soon' }
  if (diffDays <= 3) return { label: `Em ${diffDays} dias`, variant: 'soon' }

  return { label: due.toLocaleDateString('pt-BR'), variant: 'normal' }
}

export interface SubtaskProgress {
  total: number
  done: number
  percentage: number
}

export function getSubtaskProgress(subtasks: Task[]): SubtaskProgress {
  const total = subtasks.length
  const done = subtasks.filter((subtask) => subtask.status === 'done').length
  const percentage = total > 0 ? Math.round((done / total) * 100) : 0
  return { total, done, percentage }
}

export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    if (priorityDiff !== 0) return priorityDiff

    if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    if (a.due_date) return -1
    if (b.due_date) return 1
    return 0
  })
}
