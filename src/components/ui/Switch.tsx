interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  ariaLabel: string
}

export function Switch({ checked, onChange, disabled = false, ariaLabel }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'bg-[linear-gradient(135deg,#8b5cf6,#6d28d9)] shadow-[0_4px_12px_-4px_rgba(124,58,237,0.8)]' : 'bg-[var(--bg-muted)] ring-1 ring-inset ring-[var(--border-default)]'
      }`}
    >
      <span
        className={`absolute left-0 top-0.5 h-5 w-5 rounded-full bg-[#fff] shadow-sm transition-transform duration-200 ${
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}
