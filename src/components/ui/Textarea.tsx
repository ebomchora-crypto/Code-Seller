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
          <label htmlFor={textareaId} className="text-sm font-medium text-neutral-700">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={`w-full resize-none rounded-lg border bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors focus:outline-none focus:ring-2 ${
            error
              ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
              : 'border-neutral-200 focus:border-purple-400 focus:ring-purple-100'
          } ${className}`}
          aria-invalid={Boolean(error)}
          {...props}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        {!error && helperText && <p className="text-xs text-neutral-500">{helperText}</p>}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'
