import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { DEAL_STAGES } from '@/utils/deals'
import { DEAL_STATUS_LABELS, ORIGIN_SUGGESTIONS, SERVICE_SUGGESTIONS, type DealFilters as DealFiltersType } from '@/types'

interface DealFiltersProps {
  filters: DealFiltersType
  onChange: (next: Partial<DealFiltersType>) => void
  onClear: () => void
  hasActiveFilters: boolean
  resultCount: number
  loading: boolean
}

export function DealFilters({ filters, onChange, onClear, hasActiveFilters, resultCount, loading }: DealFiltersProps) {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex-1">
          <Input
            label="Buscar"
            placeholder="Título, contato ou serviço"
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

        <div className="w-full md:w-44">
          <Select label="Etapa" value={filters.stage} onChange={(event) => onChange({ stage: event.target.value as DealFiltersType['stage'] })}>
            <option value="all">Todas</option>
            {DEAL_STAGES.map((stage) => (
              <option key={stage.key} value={stage.key}>
                {stage.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-full md:w-36">
          <Select label="Status" value={filters.status} onChange={(event) => onChange({ status: event.target.value as DealFiltersType['status'] })}>
            <option value="all">Todos</option>
            {Object.entries(DEAL_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-full md:w-40">
          <Select label="Origem" value={filters.origin} onChange={(event) => onChange({ origin: event.target.value })}>
            <option value="">Todas</option>
            {ORIGIN_SUGGESTIONS.map((origin) => (
              <option key={origin} value={origin}>
                {origin}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-full md:w-44">
          <Select label="Serviço" value={filters.service} onChange={(event) => onChange({ service: event.target.value })}>
            <option value="">Todos</option>
            {SERVICE_SUGGESTIONS.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </Select>
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="md" onClick={onClear}>
            Limpar filtros
          </Button>
        )}
      </div>

      <p className="mt-3 text-xs text-[var(--text-muted)]">
        {loading ? 'Buscando negócios…' : `${resultCount} ${resultCount === 1 ? 'negócio encontrado' : 'negócios encontrados'}`}
      </p>
    </div>
  )
}
