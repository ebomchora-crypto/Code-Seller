import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
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
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Input
            placeholder="Buscar por descrição"
            value={filters.search}
            onChange={(event) => onChange({ search: event.target.value })}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4">
                <circle cx="11" cy="11" r="7" />
                <path strokeLinecap="round" d="m21 21-4.3-4.3" />
              </svg>
            }
          />
        </div>
        <Button variant="ghost" size="md" onClick={() => setExpanded((value) => !value)}>
          Filtros {expanded ? '▲' : '▼'}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="md" onClick={onClear}>
            Limpar
          </Button>
        )}
      </div>

      {expanded && (
        <div className="mt-4 grid grid-cols-1 gap-3 border-t border-[var(--border-subtle)] pt-4 sm:grid-cols-2 lg:grid-cols-4">
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
