import { Check } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { PanelHeader } from '@/components/ui/PanelHeader'
import { CHANGELOG } from '@/data/changelog'
import type { ChangelogItem } from '@/types'

const TYPE_STYLE: Record<ChangelogItem['type'], { label: string; color: string }> = {
  feature: { label: 'Novidade', color: '#a78bfa' },
  improvement: { label: 'Melhoria', color: '#60a5fa' },
  fix: { label: 'Correção', color: '#34d399' },
  breaking: { label: 'Mudança importante', color: '#f87171' },
}

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export function ChangelogSection() {
  return (
    <Card id="novidades" className="scroll-mt-6">
      <PanelHeader title="Novidades" subtitle="O que mudou no Code Sellers" />

      <ol className="relative before:absolute before:bottom-3 before:left-[5px] before:top-3 before:w-px before:bg-[var(--border-default)]">
        {CHANGELOG.map((entry, index) => {
          const style = TYPE_STYLE[entry.type]
          return (
            <li key={entry.version} className="relative pb-8 pl-8 last:pb-0">
              <span
                className="absolute left-0 top-1.5 size-[11px] rounded-full ring-4 ring-[var(--bg-card)]"
                style={{ backgroundColor: index === 0 ? style.color : 'var(--border-strong)' }}
              />
              <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
                <span className="rounded-md bg-[var(--bg-muted)] px-1.5 py-0.5 font-mono text-[12px] text-[var(--text-secondary)]">
                  v{entry.version}
                </span>
                <span className="text-[var(--text-muted)]">{formatDate(entry.date)}</span>
                <span
                  className="rounded-full px-2 py-0.5 text-[11.5px] font-medium"
                  style={{ backgroundColor: `${style.color}1f`, color: style.color }}
                >
                  {style.label}
                </span>
              </div>
              <h3 className="mt-2 text-[15px] font-semibold text-[var(--text-primary)]">{entry.title}</h3>
              <p className="mt-1 text-[13.5px] text-[var(--text-secondary)]">{entry.description}</p>
              <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                {entry.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-[13px] text-[var(--text-secondary)]">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-[var(--accent-text)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </li>
          )
        })}
      </ol>
    </Card>
  )
}
