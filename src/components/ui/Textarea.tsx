import { forwardRef, useId, type TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, id, className = '', rows = 4, ...props }, ref) => {
    const generatedId = useId()
    const textareaId = id ?? generatedId

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-[13px] font-medium text-[var(--text-secondary)]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={`w-full resize-none rounded-xl border bg-[var(--field-bg)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-all duration-200 ${
            error
              ? 'border-red-500/50 focus:border-red-500/60 focus:ring-4 focus:ring-red-500/10'
              : 'border-[var(--border-default)] hover:border-[var(--border-strong)] focus:border-[var(--accent-ring)] focus:ring-4 focus:ring-[var(--accent-tint)]'
          } ${className}`}
          aria-invalid={Boolean(error)}
          {...props}
        />
        {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
        {!error && helperText && <p className="text-xs text-[var(--text-muted)]">{helperText}</p>}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'
