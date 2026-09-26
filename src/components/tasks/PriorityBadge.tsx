import { TASK_PRIORITY_CONFIG } from '@/utils/tasks'
import type { TaskPriority } from '@/types'

interface PriorityBadgeProps {
  priority: TaskPriority
  onClick?: () => void
}

export function PriorityBadge({ priority, onClick }: PriorityBadgeProps) {
  const config = TASK_PRIORITY_CONFIG[priority]
  const Component = onClick ? 'button' : 'span'

  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11.5px] font-medium ${
        priority === 'urgent' ? 'animate-pulse' : ''
      } ${onClick ? 'cursor-pointer hover:brightness-95' : ''}`}
      style={{ backgroundColor: `${config.color}1a`, color: config.color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: config.color }} />
      {config.label}
    </Component>
  )
}
