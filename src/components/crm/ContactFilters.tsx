import { useEffect, useState } from 'react'
import { Search, X } from 'lucide-react'
import { getContactFacets } from '@/services/supabase/contacts'
import { mergeChoices } from '@/utils/choiceList'
import { FilterChips, type FilterChipOption } from '@/components/ui/FilterChips'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { CONTACT_STATUS_COLORS } from '@/components/crm/statusColors'
import {
  CONTACT_STATUS_LABELS,
  CONTACT_STATUSES,
  type ContactFilters as ContactFiltersType,
  type Tag,
} from '@/types'

interface ContactFiltersProps {
  filters: ContactFiltersType
  onChange: (next: Partial<ContactFiltersType>) => void
  onClear: () => void
  hasActiveFilters: boolean
  tags: Tag[]
  resultCount: number
  loading: boolean
  // No quadro os status já são as colunas: esconde os botões de status.
  hideStatusChips?: boolean
}

const STATUS_OPTIONS: FilterChipOption<ContactFiltersType['status']>[] = [
  { value: 'all', label: 'Todos' },
  ...CONTACT_STATUSES.map((status) => ({
    value: status,
    label: CONTACT_STATUS_LABELS[status],
    color: CONTACT_STATUS_COLORS[status],
  })),
]

export function ContactFilters({
  filters,
  onChange,
  onClear,
  hasActiveFilters,
  tags,
  resultCount,
  loading,
  hideStatusChips = false,
}: ContactFiltersProps) {
  // Só nichos/origens que existem nos contatos (filtrar por um que ninguém
  // tem não mostraria nada). Recarrega quando a lista muda.
  const [facets, setFacets] = useState<{ niches: string[]; origins: string[] }>({ niches: [], origins: [] })
  useEffect(() => {
    let cancelled = false
    void getContactFacets().then((next) => {
      if (!cancelled) setFacets({ niches: mergeChoices([], next.niches), origins: mergeChoices([], next.origins) })
    })
    return () => {
      cancelled = true
    }
  }, [resultCount])
  const niches = filters.niche && !facets.niches.includes(filters.niche) ? [filters.niche, ...facets.niches] : facets.niches
  const origins =
    filters.origin && !facets.origins.includes(filters.origin) ? [filters.origin, ...facets.origins] : facets.origins

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {!hideStatusChips && (
          <FilterChips
          label="Filtrar por status"
          options={STATUS_OPTIONS}
          value={filters.status}
          onChange={(value) => onChange({ status: value })}
        />
        )}

        <p className="text-[13px] text-[var(--text-muted)]" aria-live="polite">
          {loading ? 'Buscando contatos…' : `${resultCount} ${resultCount === 1 ? 'contato encontrado' : 'contatos encontrados'}`}
        </p>
      </div>

      <div className="flex flex-col gap-2.5 md:flex-row md:items-center">
        <div className="flex-1">
          <Input
            aria-label="Buscar contatos"
            placeholder="Buscar por nome, e-mail ou telefone"
            value={filters.search}
            onChange={(event) => onChange({ search: event.target.value })}
            icon={<Search className="size-4" />}
          />
        </div>

        <div className="grid grid-cols-3 gap-2 md:flex md:gap-2.5">
          <div className="min-w-0 md:w-40">
            <Select aria-label="Nicho" value={filters.niche} onChange={(event) => onChange({ niche: event.target.value })}>
              <option value="">Nicho</option>
              {niches.map((niche) => (
                <option key={niche} value={niche}>
                  {niche}
                </option>
              ))}
            </Select>
          </div>

          <div className="min-w-0 md:w-40">
            <Select aria-label="Origem" value={filters.origin} onChange={(event) => onChange({ origin: event.target.value })}>
              <option value="">Origem</option>
              {origins.map((origin) => (
                <option key={origin} value={origin}>
                  {origin}
                </option>
              ))}
            </Select>
          </div>

          <div className="min-w-0 md:w-36">
            <Select aria-label="Tag" value={filters.tag_id} onChange={(event) => onChange({ tag_id: event.target.value })}>
              <option value="">Tag</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
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
