import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Spinner } from '@/components/ui/Spinner'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  children: ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-purple-600 text-white hover:bg-purple-500 shadow-[0_0_20px_rgba(179,92,255,0.2)] focus-visible:ring-purple-300',
  secondary:
    'bg-[var(--bg-muted)] text-[var(--text-primary)] border border-[var(--border-default)] hover:bg-[var(--bg-card-hover)] focus-visible:ring-neutral-300',
  ghost: 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] focus-visible:ring-neutral-200',
  danger: 'bg-red-600/10 text-red-500 border border-red-500/20 hover:bg-red-600/20 focus-visible:ring-red-300',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <Spinner size="sm" className={variant === 'primary' ? 'text-white' : 'text-current'} />
      )}
      {children}
    </button>
  )
}
