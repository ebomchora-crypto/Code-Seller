import { Check } from 'lucide-react'
import { SectionLabel } from '@/components/ui/section-label'
import { PurpleDivider } from '@/components/ui/purple-divider'
import { CHANGELOG } from '@/data/changelog'
import type { ChangelogItem } from '@/types'

const TYPE_BADGE: Record<ChangelogItem['type'], string> = {
  feature: 'bg-purple-500/10 text-purple-600',
  improvement: 'bg-blue-500/10 text-blue-600',
  fix: 'bg-emerald-500/10 text-emerald-600',
  breaking: 'bg-red-500/10 text-red-600',
}

const TYPE_LABEL: Record<ChangelogItem['type'], string> = {
  feature: 'Nova funcionalidade',
  improvement: 'Melhoria',
  fix: 'Correção',
  breaking: 'Mudança importante',
}

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export function ChangelogSection() {
  return (
    <section id="novidades" className="scroll-mt-24 py-12">
      <SectionLabel>Novidades</SectionLabel>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--text-primary)]">O que há de novo</h2>
      <PurpleDivider className="mt-3" />

      <div className="mt-8 flex flex-col">
        {CHANGELOG.map((entry, index) => (
          <div
            key={entry.version}
            className={`pb-8 ${index !== CHANGELOG.length - 1 ? 'border-b border-[var(--border-subtle)]' : ''} ${
              index !== 0 ? 'pt-8' : ''
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-[var(--purple-soft)] px-2 py-0.5 font-mono text-sm text-purple-600">
                v{entry.version}
              </span>
              <span className="text-sm text-[var(--text-muted)]">{formatDate(entry.date)}</span>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${TYPE_BADGE[entry.type]}`}>
                {TYPE_LABEL[entry.type]}
              </span>
            </div>

            <h3 className="mt-2 text-base font-semibold text-[var(--text-primary)]">{entry.title}</h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{entry.description}</p>

            <ul className="mt-3 flex flex-col gap-1.5">
              {entry.items.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-purple-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
