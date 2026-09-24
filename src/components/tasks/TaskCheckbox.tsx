import { Check } from 'lucide-react'

interface TaskCheckboxProps {
  checked: boolean
  onToggle: () => void
  size?: 'sm' | 'md'
  ariaLabel: string
}

export function TaskCheckbox({ checked, onToggle, size = 'md', ariaLabel }: TaskCheckboxProps) {
  const dimension = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={(event) => {
        event.stopPropagation()
        onToggle()
      }}
      className={`flex shrink-0 items-center justify-center rounded-md border-2 transition-colors duration-200 ${dimension} ${
        checked
          ? 'border-purple-500 bg-purple-500'
          : 'border-[var(--border-default)] bg-[var(--bg-card)] hover:border-purple-400'
      }`}
    >
      <Check
        className={`h-3 w-3 text-white transition-transform duration-200 ${checked ? 'scale-100' : 'scale-0'}`}
        strokeWidth={3}
      />
    </button>
  )
}
