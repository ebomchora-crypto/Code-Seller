import type { ReactNode } from 'react'
import { Card } from '@/components/ui/Card'
import { Switch } from '@/components/ui/Switch'
import { countActiveProspectFilters, WEBSITE_KIND_LABELS } from '@/utils/prospection'
import type { ProspectFilters, WebsiteKind } from '@/types'

interface ProspectFiltersPanelProps {
  filters: ProspectFilters
  onChange: (next: Partial<ProspectFilters>) => void
  onReset: () => void
}

const REVIEW_OPTIONS = [
  { value: 0, label: 'Qualquer' },
  { value: 10, label: '10+' },
  { value: 50, label: '50+' },
  { value: 100, label: '100+' },
]

const RATING_OPTIONS = [
  { value: 0, label: 'Qualquer' },
  { value: 4, label: '4,0+' },
  { value: 4.5, label: '4,5+' },
]

function chipClass(active: boolean) {
  return `h-8 rounded-full border px-3 text-[12.5px] font-medium transition-all duration-200 ${
    active
      ? 'border-[var(--nav-active-border)] bg-[var(--accent-tint)] text-[var(--accent-text)]'
      : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
  }`
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-t border-[var(--border-subtle)] pt-4 first:border-0 first:pt-0">
      <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">{title}</p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

export function ProspectFiltersPanel({ filters, onChange, onReset }: ProspectFiltersPanelProps) {
  const activeCount = countActiveProspectFilters(filters)

  function toggleKind(kind: WebsiteKind) {
    const has = filters.websiteKinds.includes(kind)
    onChange({ websiteKinds: has ? filters.websiteKinds.filter((item) => item !== kind) : [...filters.websiteKinds, kind] })
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">Filtros</h3>
        {activeCount > 0 && (
          <button type="button" onClick={onReset} className="text-[12.5px] font-medium text-[var(--accent-text)] hover:underline">
            Limpar ({activeCount})
          </button>
        )}
      </div>

      <Group title="Presença online">
        {(Object.keys(WEBSITE_KIND_LABELS) as WebsiteKind[]).map((kind) => (
          <button
            key={kind}
            type="button"
            aria-pressed={filters.websiteKinds.includes(kind)}
            onClick={() => toggleKind(kind)}
            className={chipClass(filters.websiteKinds.includes(kind))}
          >
            {WEBSITE_KIND_LABELS[kind]}
          </button>
        ))}
      </Group>

      <Group title="Avaliações">
        {REVIEW_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={filters.minReviews === option.value}
            onClick={() => onChange({ minReviews: option.value })}
            className={chipClass(filters.minReviews === option.value)}
          >
            {option.label}
          </button>
        ))}
      </Group>

      <Group title="Nota mínima">
        {RATING_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={filters.minRating === option.value}
            onClick={() => onChange({ minRating: option.value })}
            className={chipClass(filters.minRating === option.value)}
          >
            {option.label}
          </button>
        ))}
      </Group>

      <div className="flex flex-col gap-3 border-t border-[var(--border-subtle)] pt-4">
        <label className="flex items-center justify-between gap-3 text-[13.5px] text-[var(--text-secondary)]">
          Só com telefone
          <Switch
            checked={filters.onlyWithPhone}
            onChange={(checked) => onChange({ onlyWithPhone: checked })}
            ariaLabel="Mostrar só empresas com telefone"
          />
        </label>
        <label className="flex items-center justify-between gap-3 text-[13.5px] text-[var(--text-secondary)]">
          Esconder quem já está no CRM
          <Switch
            checked={filters.hideImported}
            onChange={(checked) => onChange({ hideImported: checked })}
            ariaLabel="Esconder empresas que já estão no CRM"
          />
        </label>
      </div>
    </Card>
  )
}
