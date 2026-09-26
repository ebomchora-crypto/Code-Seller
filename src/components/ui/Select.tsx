import { ChevronDown } from 'lucide-react'
import { forwardRef, useId, type ReactNode, type SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  children: ReactNode
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, id, className = '', children, ...props }, ref) => {
    const generatedId = useId()
    const selectId = id ?? generatedId

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-[13px] font-medium text-[var(--text-secondary)]">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={`h-11 w-full cursor-pointer appearance-none rounded-xl border bg-[var(--field-bg)] pl-4 pr-10 text-sm text-[var(--text-primary)] outline-none transition-all duration-200 ${
              error
                ? 'border-red-500/50 focus:border-red-500/60 focus:ring-4 focus:ring-red-500/10'
                : 'border-[var(--border-default)] hover:border-[var(--border-strong)] focus:border-[var(--accent-ring)] focus:ring-4 focus:ring-[var(--accent-tint)]'
            } ${className}`}
            aria-invalid={Boolean(error)}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]" />
        </div>
        {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
        {!error && helperText && <p className="text-xs text-[var(--text-muted)]">{helperText}</p>}
      </div>
    )
  },
)

Select.displayName = 'Select'
