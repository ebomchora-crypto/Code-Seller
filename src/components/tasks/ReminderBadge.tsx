import { Bell } from 'lucide-react'
import { Tooltip } from '@/components/ui/Tooltip'

interface ReminderBadgeProps {
  reminder_at: string | null
}

export function ReminderBadge({ reminder_at }: ReminderBadgeProps) {
  if (!reminder_at) return null

  const formatted = new Date(reminder_at).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <Tooltip content={`Lembrete em ${formatted}`}>
      <span className="inline-flex items-center justify-center rounded-full bg-[var(--accent-tint)] p-1 text-[var(--accent-text)]">
        <Bell className="h-3 w-3" />
      </span>
    </Tooltip>
  )
}
