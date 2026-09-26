import type { ReactNode } from 'react'
import { Trash2 } from 'lucide-react'
import type { HistoryTypeMeta } from '@/components/ui/HistoryComposer'
import { formatRelativeDate } from '@/utils/date'

export interface HistoryTimelineItem {
  id: string
  meta: HistoryTypeMeta
  occurred_at: string
  body: ReactNode
  /** Registros automáticos (ex: mudança de etapa) não podem ser removidos. */
  onDelete?: () => void
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Linha do tempo de histórico (contatos e negócios).
export function HistoryTimeline({ items, emptyTitle, emptyDescription }: { items: HistoryTimelineItem[]; emptyTitle: string; emptyDescription: string }) {
  if (items.length === 0) {
    return (
      <div className="rounded-[18px] border border-dashed border-[var(--border-default)] px-6 py-12 text-center">
        <p className="text-[14px] font-medium text-[var(--text-primary)]">{emptyTitle}</p>
        <p className="mx-auto mt-1 max-w-sm text-[13px] text-[var(--text-muted)]">{emptyDescription}</p>
      </div>
    )
  }

  return (
    <ol className="relative before:absolute before:bottom-5 before:left-[17.5px] before:top-5 before:w-px before:bg-[var(--border-default)]">
      {items.map((item) => {
        const { icon: Icon, color, label } = item.meta
        return (
          <li key={item.id} className="group relative pb-5 pl-14 last:pb-0">
            <span
              className="absolute left-0 top-0 z-10 flex size-9 items-center justify-center rounded-xl border bg-[var(--bg-card)]"
              style={{ color, borderColor: `${color}55` }}
            >
              <Icon className="size-4" />
            </span>
            <div className="flex items-center justify-between gap-3">
              <p className="flex flex-wrap items-center gap-x-2 text-[12.5px]">
                <span className="font-semibold text-[var(--text-primary)]">{label}</span>
                <time dateTime={item.occurred_at} title={formatDateTime(item.occurred_at)} className="text-[var(--text-muted)]">
                  {formatRelativeDate(item.occurred_at)}
                </time>
              </p>
              {item.onDelete && (
                <button
                  type="button"
                  onClick={item.onDelete}
                  aria-label="Remover registro"
                  title="Remover"
                  className="flex size-7 items-center justify-center rounded-lg text-[var(--text-muted)] opacity-0 transition hover:bg-red-500/10 hover:text-red-500 focus:opacity-100 group-hover:opacity-100"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
            <div className="mt-1.5 whitespace-pre-line rounded-2xl rounded-tl-md border border-[var(--border-subtle)] bg-black/[0.015] px-4 py-3 text-[14px] leading-relaxed text-[var(--text-primary)] dark:bg-white/[0.025]">
              {item.body}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
