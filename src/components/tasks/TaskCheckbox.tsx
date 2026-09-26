import { Check } from 'lucide-react'

interface TaskCheckboxProps {
  checked: boolean
  onToggle: () => void
  size?: 'sm' | 'md'
  ariaLabel: string
}

export function TaskCheckbox({ checked, onToggle, size = 'md', ariaLabel }: TaskCheckboxProps) {
  const dimension = size === 'sm' ? 'size-[18px]' : 'size-[22px]'

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
      className={`flex shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${dimension} ${
        checked
          ? 'border-transparent bg-[linear-gradient(135deg,#8b5cf6,#6d28d9)] shadow-[0_4px_12px_-4px_rgba(124,58,237,0.9)]'
          : 'border-[var(--border-strong)] bg-transparent hover:border-[var(--accent-solid)]'
      }`}
    >
      <Check
        className={`size-3 text-white transition-transform duration-200 ${checked ? 'scale-100' : 'scale-0'}`}
        strokeWidth={3}
      />
    </button>
  )
}
