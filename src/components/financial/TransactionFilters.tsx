import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { PAYMENT_METHOD_LABELS } from '@/utils/financial'
import type { FinancialCategory, TransactionFilters as TransactionFiltersType } from '@/types'

interface TransactionFiltersProps {
  filters: TransactionFiltersType
  onChange: (next: Partial<TransactionFiltersType>) => void
  onClear: () => void
  hasActiveFilters: boolean
  categories: FinancialCategory[]
}

export function TransactionFilters({ filters, onChange, onClear, hasActiveFilters, categories }: TransactionFiltersProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input
            aria-label="Buscar transações"
            placeholder="Buscar por descrição"
            value={filters.search}
            onChange={(event) => onChange({ search: event.target.value })}
            icon={<Search className="size-4" />}
          />
        </div>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border px-3.5 text-[13px] font-medium transition ${
            expanded || hasActiveFilters
              ? 'border-[var(--accent-ring)] bg-[var(--accent-tint)] text-[var(--accent-text)]'
              : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <SlidersHorizontal className="size-4" />
          <span className="hidden sm:inline">Filtros</span>
        </button>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Limpar filtros"
            title="Limpar filtros"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl text-[var(--text-muted)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {expanded && (
        <div className="mt-3 grid grid-cols-1 gap-3 rounded-2xl border border-[var(--border-subtle)] p-3 sm:grid-cols-2">
          <Select
            label="Categoria"
            value={filters.category_id}
            onChange={(event) => onChange({ category_id: event.target.value })}
          >
            <option value="">Todas</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>

          <Select
            label="Método de pagamento"
            value={filters.payment_method}
            onChange={(event) => onChange({ payment_method: event.target.value as TransactionFiltersType['payment_method'] })}
          >
            <option value="all">Todos</option>
            {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>

          <Input
            label="De"
            type="date"
            value={filters.date_from}
            onChange={(event) => onChange({ date_from: event.target.value })}
          />
          <Input
            label="Até"
            type="date"
            value={filters.date_to}
            onChange={(event) => onChange({ date_to: event.target.value })}
          />
        </div>
      )}
    </div>
  )
}
