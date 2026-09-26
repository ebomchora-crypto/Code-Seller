import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { CONTACT_STATUS_COLORS } from '@/components/crm/statusColors'
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

const STATUS_OPTIONS: { value: ContactFiltersType['status']; label: string; color?: string }[] = [
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
}: ContactFiltersProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Filtrar por status" className="scrollbar-none -mx-1 flex gap-1.5 overflow-x-auto px-1">
          {STATUS_OPTIONS.map((option) => {
            const active = filters.status === option.value
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => onChange({ status: option.value })}
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
              {NICHE_SUGGESTIONS.map((niche) => (
                <option key={niche} value={niche}>
                  {niche}
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
