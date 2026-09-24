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
          <label htmlFor={selectId} className="text-sm font-medium text-neutral-700">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-neutral-900 transition-colors focus:outline-none focus:ring-2 ${
            error
              ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
              : 'border-neutral-200 focus:border-purple-400 focus:ring-purple-100'
          } ${className}`}
          aria-invalid={Boolean(error)}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs text-red-600">{error}</p>}
        {!error && helperText && <p className="text-xs text-neutral-500">{helperText}</p>}
      </div>
    )
  },
)

Select.displayName = 'Select'
