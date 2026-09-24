import { AlertCircle, Calendar, CheckCircle2, Clock } from 'lucide-react'
import { formatTaskDueDate, type DueDateDisplay } from '@/utils/tasks'

interface DueDateLabelProps {
  due_date: string | null
  completed_at: string | null
  size?: 'sm' | 'md'
}

const variantClasses: Record<DueDateDisplay['variant'], string> = {
  overdue: 'text-red-600',
  today: 'text-amber-600',
  soon: 'text-amber-500',
  normal: 'text-neutral-500',
  none: 'text-neutral-400',
  completed: 'text-emerald-600',
}

const variantIcons: Record<DueDateDisplay['variant'], typeof AlertCircle | null> = {
  overdue: AlertCircle,
  today: Clock,
  soon: Clock,
  normal: Calendar,
  none: null,
  completed: CheckCircle2,
}

export function DueDateLabel({ due_date, completed_at, size = 'md' }: DueDateLabelProps) {
  const { label, variant } = formatTaskDueDate(due_date, completed_at)
  if (variant === 'none') return null

  const Icon = variantIcons[variant]
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'

  return (
    <span className={`inline-flex items-center gap-1 font-medium ${textSize} ${variantClasses[variant]}`}>
      {Icon && <Icon className={iconSize} />}
      {label}
    </span>
  )
}
