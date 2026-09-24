import type { ReactNode } from 'react'

type BadgeVariant = 'purple' | 'neutral' | 'success' | 'warning' | 'danger'
type BadgeSize = 'sm' | 'md'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
}

const variantClasses: Record<BadgeVariant, string> = {
  purple: 'bg-purple-500/10 text-purple-500 border border-purple-500/20',
  neutral: 'bg-[var(--bg-muted)] text-[var(--text-secondary)] border border-[var(--border-subtle)]',
  success: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
  danger: 'bg-red-500/10 text-red-500 border border-red-500/20',
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-1 text-xs',
}

export function Badge({ children, variant = 'neutral', size = 'md' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium uppercase tracking-wide ${variantClasses[variant]} ${sizeClasses[size]}`}
    >
      {children}
    </span>
  )
}
