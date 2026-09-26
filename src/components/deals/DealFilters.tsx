import { Search, X } from 'lucide-react'
import { FilterChips, type FilterChipOption } from '@/components/ui/FilterChips'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
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

const STAGE_OPTIONS: FilterChipOption<DealFiltersType['stage']>[] = [
  { value: 'all', label: 'Todas' },
  ...DEAL_STAGES.map((stage) => ({ value: stage.key, label: stage.label, color: stage.color })),
]

export function DealFilters({ filters, onChange, onClear, hasActiveFilters, resultCount, loading }: DealFiltersProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterChips
          label="Filtrar por etapa"
          options={STAGE_OPTIONS}
          value={filters.stage}
          onChange={(value) => onChange({ stage: value })}
        />

        <p className="text-[13px] text-[var(--text-muted)]" aria-live="polite">
          {loading ? 'Buscando negócios…' : `${resultCount} ${resultCount === 1 ? 'negócio encontrado' : 'negócios encontrados'}`}
        </p>
      </div>

      <div className="flex flex-col gap-2.5 md:flex-row md:items-center">
        <div className="flex-1">
          <Input
            aria-label="Buscar negócios"
            placeholder="Buscar por título, contato ou serviço"
            value={filters.search}
            onChange={(event) => onChange({ search: event.target.value })}
            icon={<Search className="size-4" />}
          />
        </div>

        <div className="grid grid-cols-3 gap-2 md:flex md:gap-2.5">
          <div className="min-w-0 md:w-36">
            <Select
              aria-label="Status"
              value={filters.status}
              onChange={(event) => onChange({ status: event.target.value as DealFiltersType['status'] })}
            >
              <option value="all">Status</option>
              {Object.entries(DEAL_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>

          <div className="min-w-0 md:w-40">
            <Select aria-label="Origem" value={filters.origin} onChange={(event) => onChange({ origin: event.target.value })}>
              <option value="">Origem</option>
              {ORIGIN_SUGGESTIONS.map((origin) => (
                <option key={origin} value={origin}>
                  {origin}
                </option>
              ))}
            </Select>
          </div>

          <div className="min-w-0 md:w-44">
            <Select aria-label="Serviço" value={filters.service} onChange={(event) => onChange({ service: event.target.value })}>
              <option value="">Serviço</option>
              {SERVICE_SUGGESTIONS.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl px-3 text-[13px] font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
          >
            <X className="size-4" />
            Limpar filtros
          </button>
        )}
      </div>
    </div>
  )
}
