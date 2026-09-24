import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
}

function DefaultIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className="h-6 w-6"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M8 12h8M12 8v8" strokeLinecap="round" />
    </svg>
  )
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-neutral-200 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 text-purple-600">
        {icon ?? <DefaultIcon />}
      </div>
      <h3 className="text-base font-medium text-neutral-900">{title}</h3>
      {description && <p className="max-w-sm text-sm text-neutral-500">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
