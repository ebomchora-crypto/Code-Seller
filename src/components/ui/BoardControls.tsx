import { ArrowRightLeft } from 'lucide-react'

export interface BoardColumnOption<K extends string> {
  key: K
  label: string
  color: string
  count: number
  // Texto extra no botão (ex.: total em R$).
  hint?: string
}

// Telas menores: em vez de rolar para o lado, escolhe a coluna por aqui.
export function BoardTabs<K extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: BoardColumnOption<K>[]
  value: K
  onChange: (key: K) => void
}) {
  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const active = option.key === value
        return (
          <button
            key={option.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.key)}
            className={`inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-[13px] font-medium transition-colors ${
              active
                ? 'border-[var(--accent-ring)] bg-[var(--accent-tint)] text-[var(--text-primary)]'
                : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
            }`}
          >
            <span className="size-2 rounded-full" style={{ backgroundColor: option.color }} />
            {option.label}
            <span className="tabular-nums text-[var(--text-muted)]">{option.count}</span>
          </button>
        )
      })}
    </div>
  )
}

// "Mover para…" em cada cartão quando não dá para arrastar entre colunas.
export function MoveToSelect<K extends string>({
  current,
  options,
  onMove,
  itemName,
}: {
  current: K
  options: { key: K; label: string }[]
  onMove: (key: K) => void
  itemName: string
}) {
  return (
    <label className="relative mt-1.5 flex h-9 items-center gap-2 rounded-xl border border-dashed border-[var(--border-default)] px-3 text-[12.5px] font-medium text-[var(--text-secondary)] focus-within:border-[var(--accent-ring)]">
      <ArrowRightLeft className="size-3.5 text-[var(--text-muted)]" />
      Mover para…
      <select
        aria-label={`Mover ${itemName} para outra etapa`}
        value={current}
        onChange={(event) => onMove(event.target.value as K)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {options.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
