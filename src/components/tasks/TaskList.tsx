import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { TaskCheckbox } from '@/components/tasks/TaskCheckbox'
import { PriorityBadge } from '@/components/tasks/PriorityBadge'
import { DueDateLabel } from '@/components/tasks/DueDateLabel'
import { ReminderBadge } from '@/components/tasks/ReminderBadge'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Button } from '@/components/ui/Button'
import { getSubtaskProgress, TASK_PRIORITY_CONFIG, TASK_STATUS_CONFIG } from '@/utils/tasks'
import type { Task, TaskFilters, TaskPriority, TaskStatus } from '@/types'

interface TaskListProps {
  tasks: Task[]
  loading: boolean
  error?: string | null
  onRetry?: () => void
  hasActiveFilters: boolean
  filters: TaskFilters
  onOpenTask: (task: Task) => void
  onComplete: (id: string) => void
  onDeleteRequest: (task: Task) => void
  onCreateTask: () => void
}

type GroupBy = 'priority' | 'status' | 'due_date'

const PRIORITY_ORDER: TaskPriority[] = ['urgent', 'high', 'medium', 'low']
const STATUS_ORDER: TaskStatus[] = ['todo', 'in_progress', 'cancelled']

function dueGroupOf(task: Task): string {
  if (!task.due_date) return 'Sem data'
  const due = new Date(task.due_date)
  const now = new Date()
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffDays = Math.round((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'Vencidas'
  if (diffDays === 0) return 'Hoje'
  if (diffDays <= 7) return 'Esta semana'
  return 'Mais tarde'
}

function TaskRow({
  task,
  onOpenTask,
  onComplete,
  onDeleteRequest,
}: {
  task: Task
  onOpenTask: (task: Task) => void
  onComplete: (id: string) => void
  onDeleteRequest: (task: Task) => void
}) {
  const progress = getSubtaskProgress(task.subtasks ?? [])
  const isDone = task.status === 'done'

  return (
    <div className="group flex items-start gap-3 border-b border-neutral-100 px-4 py-3 transition-colors duration-150 last:border-0 hover:bg-purple-50/60">
      <div className="pt-0.5">
        <TaskCheckbox checked={isDone} onToggle={() => onComplete(task.id)} ariaLabel={`Concluir ${task.title}`} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenTask(task)}
            className={`text-left text-sm font-medium transition-colors duration-150 ${
              isDone ? 'text-neutral-400 line-through' : 'text-neutral-900 hover:text-purple-700'
            }`}
          >
            {task.title}
          </button>
          <PriorityBadge priority={task.priority} />
          <DueDateLabel due_date={task.due_date} completed_at={task.completed_at} size="sm" />
          <ReminderBadge reminder_at={task.reminder_at} />
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          {task.tags?.map((tag) => (
            <span
              key={tag.id}
              className="rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{ backgroundColor: `${tag.color}1a`, color: tag.color }}
            >
              {tag.name}
            </span>
          ))}
          {task.contact && (
            <Link to={`/crm/${task.contact.id}`} className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-purple-100 text-[9px] font-medium text-purple-700">
                {task.contact.name.slice(0, 1).toUpperCase()}
              </span>
              {task.contact.name}
            </Link>
          )}
          {task.deal && (
            <Link
              to={`/deals/${task.deal.id}`}
              className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600 hover:bg-blue-100"
            >
              {task.deal.title}
            </Link>
          )}
          {progress.total > 0 && (
            <span className="flex items-center gap-1.5 text-[11px] text-neutral-400">
              <span className="h-1 w-10 overflow-hidden rounded-full bg-neutral-100">
                <span className="block h-full rounded-full bg-purple-400" style={{ width: `${progress.percentage}%` }} />
              </span>
              {progress.done}/{progress.total}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 gap-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        <button type="button" onClick={() => onOpenTask(task)} className="text-xs font-medium text-neutral-500 hover:text-purple-700">
          Editar
        </button>
        {!isDone && (
          <button type="button" onClick={() => onComplete(task.id)} className="text-xs font-medium text-neutral-500 hover:text-emerald-600">
            Concluir
          </button>
        )}
        <button type="button" onClick={() => onDeleteRequest(task)} className="text-xs font-medium text-neutral-500 hover:text-red-600">
          Deletar
        </button>
      </div>
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3 last:border-0">
      <Skeleton className="h-5 w-5 rounded-full" />
      <Skeleton className="h-4 flex-1 max-w-[200px]" />
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-16" />
    </div>
  )
}

function emptyMessageFor(filters: TaskFilters, hasActiveFilters: boolean): string {
  if (filters.due === 'overdue') return 'Nenhuma tarefa vencida. Você está em dia!'
  if (filters.due === 'today') return 'Nenhuma tarefa para hoje.'
  if (filters.due === 'week') return 'Nenhuma tarefa para esta semana.'
  if (hasActiveFilters) return 'Nenhuma tarefa encontrada para os filtros selecionados.'
  return 'Nenhuma tarefa cadastrada ainda.'
}

export function TaskList({
  tasks,
  loading,
  error,
  onRetry,
  hasActiveFilters,
  filters,
  onOpenTask,
  onComplete,
  onDeleteRequest,
  onCreateTask,
}: TaskListProps) {
  const [groupBy, setGroupBy] = useState<GroupBy>('priority')
  const [showCompleted, setShowCompleted] = useState(false)

  const activeTasks = tasks.filter((task) => task.status !== 'done')
  const completedTasks = tasks.filter((task) => task.status === 'done')

  const groups = useMemo(() => {
    if (groupBy === 'priority') {
      return PRIORITY_ORDER.map((priority) => ({
        key: priority,
        label: TASK_PRIORITY_CONFIG[priority].label,
        tasks: activeTasks.filter((task) => task.priority === priority),
      })).filter((group) => group.tasks.length > 0)
    }

    if (groupBy === 'status') {
      return STATUS_ORDER.map((status) => ({
        key: status,
        label: TASK_STATUS_CONFIG[status].label,
        tasks: activeTasks.filter((task) => task.status === status),
      })).filter((group) => group.tasks.length > 0)
    }

    const dueGroups = ['Vencidas', 'Hoje', 'Esta semana', 'Mais tarde', 'Sem data']
    return dueGroups
      .map((label) => ({ key: label, label, tasks: activeTasks.filter((task) => dueGroupOf(task) === label) }))
      .filter((group) => group.tasks.length > 0)
  }, [activeTasks, groupBy])

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-end">
        <div className="w-44">
          <Select value={groupBy} onChange={(event) => setGroupBy(event.target.value as GroupBy)}>
            <option value="priority">Agrupar por prioridade</option>
            <option value="status">Agrupar por status</option>
            <option value="due_date">Agrupar por vencimento</option>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        {loading ? (
          Array.from({ length: 8 }).map((_, index) => <SkeletonRow key={index} />)
        ) : tasks.length === 0 ? (
          <EmptyState
            title={emptyMessageFor(filters, hasActiveFilters)}
            action={<Button size="sm" onClick={onCreateTask}>Nova tarefa</Button>}
          />
        ) : (
          <>
            {groups.map((group) => (
              <div key={group.key}>
                <div className="flex items-center justify-between bg-neutral-50 px-4 py-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">{group.label}</span>
                  <span className="text-xs text-neutral-400">{group.tasks.length}</span>
                </div>
                {group.tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onOpenTask={onOpenTask}
                    onComplete={onComplete}
                    onDeleteRequest={onDeleteRequest}
                  />
                ))}
              </div>
            ))}

            {completedTasks.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowCompleted((value) => !value)}
                  className="flex w-full items-center justify-between bg-neutral-50 px-4 py-2 text-xs font-medium uppercase tracking-wide text-neutral-500 hover:bg-neutral-100"
                >
                  Ver {completedTasks.length} concluídas
                  <span>{showCompleted ? '▲' : '▼'}</span>
                </button>
                {showCompleted &&
                  completedTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onOpenTask={onOpenTask}
                      onComplete={onComplete}
                      onDeleteRequest={onDeleteRequest}
                    />
                  ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
