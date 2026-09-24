import { Link } from 'react-router-dom'
import { PriorityBadge } from '@/components/tasks/PriorityBadge'
import { DueDateLabel } from '@/components/tasks/DueDateLabel'
import { ReminderBadge } from '@/components/tasks/ReminderBadge'
import { TASK_PRIORITY_CONFIG, getSubtaskProgress } from '@/utils/tasks'
import type { Task } from '@/types'

interface TaskCardProps {
  task: Task
  onOpen: () => void
  isDragging?: boolean
}

export function TaskCard({ task, onOpen, isDragging = false }: TaskCardProps) {
  const priorityColor = TASK_PRIORITY_CONFIG[task.priority].color
  const progress = getSubtaskProgress(task.subtasks ?? [])

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpen()
        }
      }}
      style={{ borderLeftColor: priorityColor }}
      className={`block w-full cursor-pointer rounded-xl border border-[var(--border-subtle)] border-l-[3px] bg-[var(--bg-card)] p-4 text-left transition-all duration-200 hover:shadow-[var(--shadow-card)] ${
        isDragging ? 'rotate-2 opacity-95 shadow-[0_16px_50px_rgba(179,92,255,0.20)]' : 'shadow-[var(--shadow-card)]'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={`truncate text-sm font-medium ${task.status === 'done' ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-primary)]'}`}>
          {task.title}
        </p>
        <PriorityBadge priority={task.priority} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <DueDateLabel due_date={task.due_date} completed_at={task.completed_at} size="sm" />
        <ReminderBadge reminder_at={task.reminder_at} />
      </div>

      {task.tags && task.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.tags.map((tag) => (
            <span
              key={tag.id}
              className="rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{ backgroundColor: `${tag.color}1a`, color: tag.color }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {task.contact && (
        <Link
          to={`/crm/${task.contact.id}`}
          onClick={(event) => event.stopPropagation()}
          className="mt-2 inline-flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-700"
        >
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-purple-100 text-[9px] font-medium text-purple-700">
            {task.contact.name.slice(0, 1).toUpperCase()}
          </span>
          {task.contact.name}
        </Link>
      )}

      {progress.total > 0 && (
        <div className="mt-3">
          <div className="h-1 w-full overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full rounded-full bg-purple-400 transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-neutral-400">
            {progress.done}/{progress.total} subtarefas
          </p>
        </div>
      )}
    </div>
  )
}
