import { TASK_STATUS_CONFIG } from '@/utils/tasks'
import type { TaskStatus } from '@/types'

interface StatusBadgeProps {
  status: TaskStatus
  onClick?: () => void
}

export function StatusBadge({ status, onClick }: StatusBadgeProps) {
  const config = TASK_STATUS_CONFIG[status]
  const Component = onClick ? 'button' : 'span'

  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors duration-150 ${
        onClick ? 'cursor-pointer hover:brightness-95' : ''
      }`}
      style={{ backgroundColor: `${config.color}1f`, color: config.color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: config.color }} />
      {config.label}
    </Component>
  )
}
