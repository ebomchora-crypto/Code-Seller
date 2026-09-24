import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
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
  { key: 'week', label: 'Esta Semana' },
  { key: 'overdue', label: 'Vencidas' },
  { key: 'no_date', label: 'Sem Data' },
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
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-1">
        {QUICK_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange({ due: tab.key })}
            className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
              filters.due === tab.key
                ? 'bg-[var(--purple-soft)] text-purple-500'
                : 'text-[var(--text-muted)] hover:bg-[var(--bg-muted)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Input
              placeholder="Buscar por título ou descrição"
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
          <Button variant="ghost" onClick={() => setExpanded((value) => !value)}>
            Filtros {expanded ? '▲' : '▼'}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" onClick={onClear}>
              Limpar filtros
            </Button>
          )}
        </div>

        {expanded && (
          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-[var(--border-subtle)] pt-4 sm:grid-cols-2 lg:grid-cols-5">
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
