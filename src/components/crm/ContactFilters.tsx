import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import {
  CONTACT_STATUS_LABELS,
  CONTACT_STATUSES,
  NICHE_SUGGESTIONS,
  ORIGIN_SUGGESTIONS,
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
}

export function ContactFilters({
  filters,
  onChange,
  onClear,
  hasActiveFilters,
  tags,
  resultCount,
  loading,
}: ContactFiltersProps) {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex-1">
          <Input
            label="Buscar"
            placeholder="Nome, e-mail ou telefone"
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

        <div className="w-full md:w-40">
          <Select
            label="Status"
            value={filters.status}
            onChange={(event) => onChange({ status: event.target.value as ContactFiltersType['status'] })}
          >
            <option value="all">Todos</option>
            {CONTACT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {CONTACT_STATUS_LABELS[status]}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-full md:w-40">
          <Select
            label="Nicho"
            value={filters.niche}
            onChange={(event) => onChange({ niche: event.target.value })}
          >
            <option value="">Todos</option>
            {NICHE_SUGGESTIONS.map((niche) => (
              <option key={niche} value={niche}>
                {niche}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-full md:w-40">
          <Select
            label="Origem"
            value={filters.origin}
            onChange={(event) => onChange({ origin: event.target.value })}
          >
            <option value="">Todas</option>
            {ORIGIN_SUGGESTIONS.map((origin) => (
              <option key={origin} value={origin}>
                {origin}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-full md:w-40">
          <Select label="Tag" value={filters.tag_id} onChange={(event) => onChange({ tag_id: event.target.value })}>
            <option value="">Todas</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
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
        {loading ? 'Buscando contatos…' : `${resultCount} ${resultCount === 1 ? 'contato encontrado' : 'contatos encontrados'}`}
      </p>
    </div>
  )
}
