import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { FilterChips } from '@/components/ui/FilterChips'
import { getContacts } from '@/services/supabase/contacts'
import { getDeals } from '@/services/supabase/deals'
import { useTags } from '@/hooks/useTags'
import { TASK_PRIORITY_CONFIG, TASK_STATUS_CONFIG } from '@/utils/tasks'
import type { Contact, Deal, TaskFilters as TaskFiltersType } from '@/types'

interface TaskFiltersProps {
  filters: TaskFiltersType
  onChange: (next: Partial<TaskFiltersType>) => void
  onClear: () => void
  hasActiveFilters: boolean
}

const QUICK_TABS: { key: TaskFiltersType['due']; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'today', label: 'Hoje' },
  { key: 'week', label: 'Esta semana' },
  { key: 'overdue', label: 'Vencidas' },
  { key: 'no_date', label: 'Sem data' },
]

export function TaskFilters({ filters, onChange, onClear, hasActiveFilters }: TaskFiltersProps) {
  const [expanded, setExpanded] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const { tags } = useTags()

  useEffect(() => {
    getContacts({ pageSize: 100 }).then((result) => setContacts(result.data)).catch(() => setContacts([]))
    getDeals({}).then((result) => setDeals(result.data)).catch(() => setDeals([]))
  }, [])

  return (
    <div className="flex flex-col gap-3">
      <FilterChips
        label="Filtrar por prazo"
        options={QUICK_TABS.map((tab) => ({ value: tab.key, label: tab.label }))}
        value={filters.due}
        onChange={(due) => onChange({ due })}
      />

      <div>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Input
              aria-label="Buscar tarefas"
              placeholder="Buscar por título ou descrição"
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
          <div className="mt-3 grid grid-cols-1 gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3 sm:grid-cols-2 lg:grid-cols-5">
            <Select label="Prioridade" value={filters.priority} onChange={(event) => onChange({ priority: event.target.value as TaskFiltersType['priority'] })}>
              <option value="all">Todas</option>
              {Object.entries(TASK_PRIORITY_CONFIG).map(([value, config]) => (
                <option key={value} value={value}>
                  {config.label}
                </option>
              ))}
            </Select>

            <Select label="Status" value={filters.status} onChange={(event) => onChange({ status: event.target.value as TaskFiltersType['status'] })}>
              <option value="all">Todos</option>
              {Object.entries(TASK_STATUS_CONFIG).map(([value, config]) => (
                <option key={value} value={value}>
                  {config.label}
                </option>
              ))}
            </Select>

            <Select label="Contato" value={filters.contact_id} onChange={(event) => onChange({ contact_id: event.target.value })}>
              <option value="">Todos</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}
                </option>
              ))}
            </Select>

            <Select label="Negócio" value={filters.deal_id} onChange={(event) => onChange({ deal_id: event.target.value })}>
              <option value="">Todos</option>
              {deals.map((deal) => (
                <option key={deal.id} value={deal.id}>
                  {deal.title}
                </option>
              ))}
            </Select>

            <Select label="Tag" value={filters.tag_id} onChange={(event) => onChange({ tag_id: event.target.value })}>
              <option value="">Todas</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>
    </div>
  )
}
