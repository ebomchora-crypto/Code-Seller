import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { TaskCheckbox } from '@/components/tasks/TaskCheckbox'
import { PriorityBadge } from '@/components/tasks/PriorityBadge'
import { DueDateLabel } from '@/components/tasks/DueDateLabel'
import { ReminderBadge } from '@/components/tasks/ReminderBadge'
import { Card } from '@/components/ui/Card'
import { Briefcase, CheckCircle2, ChevronDown, Pencil, Trash2, UserRound } from 'lucide-react'
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

const GROUP_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: 'priority', label: 'Prioridade' },
  { value: 'due_date', label: 'Prazo' },
  { value: 'status', label: 'Status' },
]

const DUE_GROUP_COLORS: Record<string, string | undefined> = {
  Vencidas: '#ef4444',
  Hoje: '#f59e0b',
  'Esta semana': '#a78bfa',
  'Mais tarde': '#60a5fa',
  'Sem data': undefined,
}

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
    <div className="group flex items-start gap-3 border-b border-[var(--border-subtle)] px-5 py-3.5 transition-colors duration-150 last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.025]">
      <div className="pt-0.5">
        <TaskCheckbox checked={isDone} onToggle={() => onComplete(task.id)} ariaLabel={`Concluir ${task.title}`} />
      </div>

      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onOpenTask(task)}
          className={`text-left text-[14.5px] font-medium transition-colors duration-150 ${
            isDone
              ? 'text-[var(--text-muted)] line-through'
              : 'text-[var(--text-primary)] hover:text-[var(--accent-text)]'
          }`}
        >
          {task.title}
        </button>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <PriorityBadge priority={task.priority} />
          <DueDateLabel due_date={task.due_date} completed_at={task.completed_at} size="sm" />
          <ReminderBadge reminder_at={task.reminder_at} />
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
            <Link
              to={`/crm/${task.contact.id}`}
              className="inline-flex items-center gap-1.5 text-[12px] text-[var(--text-secondary)] hover:text-[var(--accent-text)]"
            >
              <UserRound className="size-3.5 text-[var(--text-muted)]" />
              {task.contact.name}
            </Link>
          )}
          {task.deal && (
            <Link
              to={`/deals/${task.deal.id}`}
              className="inline-flex items-center gap-1.5 text-[12px] text-[var(--text-secondary)] hover:text-[var(--accent-text)]"
            >
              <Briefcase className="size-3.5 text-[var(--text-muted)]" />
              {task.deal.title}
            </Link>
          )}
          {progress.total > 0 && (
            <span className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)]">
              <span className="h-1.5 w-12 overflow-hidden rounded-full bg-[var(--bg-muted)]">
                <span
                  className="block h-full rounded-full bg-[var(--accent-solid)]"
                  style={{ width: `${progress.percentage}%` }}
                />
              </span>
              {progress.done}/{progress.total}
            </span>
          )}
        </div>
      </div>

      <div className="hidden shrink-0 gap-0.5 opacity-0 sm:flex transition-opacity duration-150 focus-within:opacity-100 group-hover:opacity-100">
        <button
          type="button"
          onClick={() => onOpenTask(task)}
          aria-label={`Abrir ${task.title}`}
          title="Abrir"
          className={`${iconButton} hover:text-[var(--accent-text)]`}
        >
          <Pencil className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => onDeleteRequest(task)}
          aria-label={`Excluir ${task.title}`}
          title="Excluir"
          className={`${iconButton} hover:text-red-500`}
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  )
}

const iconButton =
  'flex size-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-muted)]'

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] px-5 py-4 last:border-0">
      <Skeleton className="size-5 rounded-full" />
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
        color: TASK_PRIORITY_CONFIG[priority].color as string | undefined,
        tasks: activeTasks.filter((task) => task.priority === priority),
      })).filter((group) => group.tasks.length > 0)
    }

    if (groupBy === 'status') {
      return STATUS_ORDER.map((status) => ({
        key: status,
        label: TASK_STATUS_CONFIG[status].label,
        color: TASK_STATUS_CONFIG[status].color as string | undefined,
        tasks: activeTasks.filter((task) => task.status === status),
      })).filter((group) => group.tasks.length > 0)
    }

    const dueGroups = ['Vencidas', 'Hoje', 'Esta semana', 'Mais tarde', 'Sem data']
    return dueGroups
      .map((label) => ({
        key: label,
        label,
        color: DUE_GROUP_COLORS[label],
        tasks: activeTasks.filter((task) => dueGroupOf(task) === label),
      }))
      .filter((group) => group.tasks.length > 0)
  }, [activeTasks, groupBy])

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />
  }

  return (
    <Card className="overflow-hidden !p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-5 py-3.5">
        <p className="text-[13px] text-[var(--text-muted)]">
          <span className="font-semibold text-[var(--text-primary)]">{activeTasks.length}</span>{' '}
          {activeTasks.length === 1 ? 'tarefa em aberto' : 'tarefas em aberto'}
        </p>
        <div
          role="group"
          aria-label="Agrupar por"
          className="flex items-center gap-1 rounded-full border border-[var(--border-default)] p-1"
        >
          {GROUP_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={groupBy === option.value}
              onClick={() => setGroupBy(option.value)}
              className={`h-7 rounded-full px-3 text-[12.5px] font-medium transition-colors ${
                groupBy === option.value
                  ? 'bg-[var(--accent-tint)] text-[var(--accent-text)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        Array.from({ length: 8 }).map((_, index) => <SkeletonRow key={index} />)
      ) : tasks.length === 0 ? (
        <div className="p-6">
          <EmptyState
            title={emptyMessageFor(filters, hasActiveFilters)}
            action={
              <Button size="sm" className="h-9 rounded-full px-4" onClick={onCreateTask}>
                Nova tarefa
              </Button>
            }
          />
        </div>
      ) : (
        <>
          {groups.map((group) => (
            <div key={group.key}>
              <div className="flex items-center gap-2 bg-black/[0.02] px-5 py-2 dark:bg-white/[0.02]">
                {group.color && <span className="size-2 rounded-full" style={{ backgroundColor: group.color }} />}
                <span className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
                  {group.label}
                </span>
                <span className="text-[12px] tabular-nums text-[var(--text-muted)]">{group.tasks.length}</span>
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
            <div className="border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setShowCompleted((value) => !value)}
                aria-expanded={showCompleted}
                className="flex w-full items-center justify-between px-5 py-3 text-[13px] font-medium text-[var(--text-secondary)] transition hover:bg-black/[0.02] hover:text-[var(--text-primary)] dark:hover:bg-white/[0.02]"
              >
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  {completedTasks.length} {completedTasks.length === 1 ? 'concluída' : 'concluídas'}
                </span>
                <ChevronDown className={`size-4 transition-transform ${showCompleted ? 'rotate-180' : ''}`} />
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
    </Card>
  )
}
