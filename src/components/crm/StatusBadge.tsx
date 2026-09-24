import { CONTACT_STATUS_LABELS, type ContactStatus } from '@/types'

interface StatusBadgeProps {
  status: ContactStatus
  onClick?: () => void
}

const statusClasses: Record<ContactStatus, string> = {
  lead: 'bg-purple-50 text-purple-700',
  negotiating: 'bg-amber-50 text-amber-700',
  client: 'bg-emerald-50 text-emerald-700',
  inactive: 'bg-neutral-100 text-neutral-600',
  lost: 'bg-red-50 text-red-700',
}

const dotClasses: Record<ContactStatus, string> = {
  lead: 'bg-purple-500',
  negotiating: 'bg-amber-500',
  client: 'bg-emerald-500',
  inactive: 'bg-neutral-400',
  lost: 'bg-red-500',
}

export function StatusBadge({ status, onClick }: StatusBadgeProps) {
  const Component = onClick ? 'button' : 'span'

  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-wide transition-colors duration-150 ${statusClasses[status]} ${onClick ? 'cursor-pointer hover:brightness-95' : ''}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotClasses[status]}`} />
      {CONTACT_STATUS_LABELS[status]}
    </Component>
  )
}
