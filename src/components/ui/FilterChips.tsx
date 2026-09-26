export interface FilterChipOption<T extends string> {
  value: T
  label: string
  /** Bolinha colorida antes do rótulo (status, etapa…). */
  color?: string
}

interface FilterChipsProps<T extends string> {
  label: string
  options: FilterChipOption<T>[]
  value: T
  onChange: (value: T) => void
}

// Linha de chips de filtro de escolha única, rolável no celular.
export function FilterChips<T extends string>({ label, options, value, onChange }: FilterChipsProps<T>) {
  return (
    <div role="group" aria-label={label} className="scrollbar-none -mx-1 flex gap-1.5 overflow-x-auto px-1">
      {options.map((option) => {
        const active = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-[13px] font-medium transition-all duration-200 ${
              active
                ? 'border-[var(--nav-active-border)] text-[var(--text-primary)] shadow-[var(--nav-active-shadow)]'
                : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
            }`}
            style={active ? { background: 'var(--nav-active-bg)' } : undefined}
          >
            {option.color && <span className="size-2 rounded-full" style={{ backgroundColor: option.color }} />}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
