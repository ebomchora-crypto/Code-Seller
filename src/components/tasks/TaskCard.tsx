import { Link } from 'react-router-dom'
import { PriorityBadge } from '@/components/tasks/PriorityBadge'
import { InitialsAvatar } from '@/components/ui/InitialsAvatar'
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
      className={`relative block w-full cursor-pointer overflow-hidden rounded-[18px] border bg-[var(--bg-card)] p-4 text-left transition-all duration-200 hover:border-[var(--accent-ring)] ${
        isDragging
          ? 'rotate-2 border-[var(--accent-ring)] shadow-[0_24px_60px_-20px_rgba(124,58,237,0.55)]'
          : 'border-[var(--border-subtle)] shadow-[var(--shadow-card)]'
      }`}
    >
      <span className="absolute inset-y-3 left-0 w-[3px] rounded-r-full" style={{ backgroundColor: priorityColor }} aria-hidden />
      <p
        className={`line-clamp-2 text-[14px] font-semibold leading-snug ${
          task.status === 'done' ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-primary)]'
        }`}
      >
        {task.title}
      </p>
      <div className="mt-2">
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
          className="mt-3 flex items-center gap-2 border-t border-[var(--border-subtle)] pt-3 text-[12.5px] text-[var(--text-secondary)] hover:text-[var(--accent-text)]"
        >
          <InitialsAvatar name={task.contact.name} size="sm" />
          <span className="truncate">{task.contact.name}</span>
        </Link>
      )}

      {progress.total > 0 && (
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-muted)]">
            <div
              className="h-full rounded-full bg-[var(--accent-solid)] transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <p className="mt-1 text-[11.5px] text-[var(--text-muted)]">
            {progress.done}/{progress.total} subtarefas
          </p>
        </div>
      )}
    </div>
  )
}
