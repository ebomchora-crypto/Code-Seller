import { useId, useState } from 'react'
import { Check } from 'lucide-react'
import { filterChoices, normalizeChoice } from '@/utils/choiceList'

interface ChoiceFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: readonly string[]
  placeholder?: string
  // Quantas opções aparecem antes de "Ver todas".
  visible?: number
}

// Campo de escolha rápida: clica numa opção comum ou digita outra.
export function ChoiceField({ label, value, onChange, options, placeholder, visible = 10 }: ChoiceFieldProps) {
  const inputId = useId()
  const [expanded, setExpanded] = useState(false)
  const selected = normalizeChoice(value)
  const isOption = options.some((option) => normalizeChoice(option) === selected)

  // Digitando algo que não é uma das opções: mostra só as que combinam.
  const matches = value && !isOption ? filterChoices(options, value) : [...options]
  const shown = expanded || (value && !isOption) ? matches : matches.slice(0, visible)
  // A escolhida sempre aparece, mesmo fora das primeiras.
  const selectedOption = options.find((option) => normalizeChoice(option) === selected)
  if (selectedOption && !shown.includes(selectedOption)) shown.push(selectedOption)
  const hidden = matches.length - shown.length

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-[13px] font-medium text-[var(--text-secondary)]">
        {label}
      </label>
      <input
        id={inputId}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-[var(--border-default)] bg-[var(--field-bg)] px-4 text-sm text-[var(--text-primary)] outline-none transition-all duration-200 placeholder:text-[var(--text-muted)] hover:border-[var(--border-strong)] focus:border-[var(--accent-ring)] focus:ring-4 focus:ring-[var(--accent-tint)]"
      />
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={`${label}: opções`}>
        {shown.map((option) => {
          const active = normalizeChoice(option) === selected
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active ? '' : option)}
              className={`inline-flex h-8 items-center gap-1 rounded-full border px-3 text-[12.5px] font-medium transition-colors ${
                active
                  ? 'border-[var(--accent-ring)] bg-[var(--accent-tint)] text-[var(--accent-text)]'
                  : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
              }`}
            >
              {active && <Check className="size-3.5" />}
              {option}
            </button>
          )
        })}
        {hidden > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="inline-flex h-8 items-center rounded-full px-2.5 text-[12.5px] font-medium text-[var(--accent-text)] hover:underline"
          >
            Ver mais {hidden}
          </button>
        )}
        {value && !isOption && matches.length === 0 && (
          <span className="inline-flex h-8 items-center text-[12px] text-[var(--text-muted)]">
            “{value.trim()}” será salvo como novo.
          </span>
        )}
      </div>
    </div>
  )
}
