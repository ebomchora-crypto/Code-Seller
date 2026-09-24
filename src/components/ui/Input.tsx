import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  icon?: ReactNode
  /** Sobrescreve a cor padrão do label — usado no AuthLayout (fundo sempre escuro). */
  labelClassName?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, helperText, icon, id, className = '', labelClassName = 'text-[var(--text-secondary)]', ...props },
    ref,
  ) => {
    const generatedId = useId()
    const inputId = id ?? generatedId

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className={`text-sm font-medium ${labelClassName}`}>
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[var(--text-muted)]">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`h-10 w-full rounded-xl border bg-[var(--bg-muted)] px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-all duration-200 ${
              error
                ? 'border-red-500/50 focus:border-red-500/60 focus:ring-2 focus:ring-red-500/10'
                : 'border-[var(--border-default)] focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/10'
            } ${icon ? 'pl-9' : ''} ${className}`}
            aria-invalid={Boolean(error)}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        {!error && helperText && <p className="text-xs text-[var(--text-muted)]">{helperText}</p>}
      </div>
    )
  },
)

Input.displayName = 'Input'
