import type { Contact, Tag } from './crm'
import type { Deal } from './deals'

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskRecurrence = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface Task {
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
  // Relações opcionais (join)
  tags?: Tag[]
  contact?: Pick<Contact, 'id' | 'name' | 'email'>
  deal?: Pick<Deal, 'id' | 'title' | 'stage'>
  subtasks?: Task[]
}

export interface TaskFilters {
  search: string
  status: TaskStatus | 'all'
  priority: TaskPriority | 'all'
  contact_id: string
  deal_id: string
  tag_id: string
  due: 'all' | 'today' | 'week' | 'overdue' | 'no_date'
}

export type TasksView = 'list' | 'kanban'

// Agrupamento para o kanban
export interface TaskKanbanColumn {
  status: TaskStatus
  label: string
  color: string
  tasks: Task[]
}

// Métricas de tarefas para o Dashboard
export interface TaskMetrics {
  total: number
  pending: number // todo + in_progress
  done_today: number
  overdue: number
}
