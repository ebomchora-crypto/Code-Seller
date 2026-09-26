import { Link } from 'react-router-dom'
import { CalendarDays } from 'lucide-react'
import { InitialsAvatar } from '@/components/ui/InitialsAvatar'
import { formatCurrency, getStageConfig } from '@/utils/deals'
import type { Deal } from '@/types'

interface DealCardProps {
  deal: Deal
  isDragging?: boolean
}

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
}

export function DealCard({ deal, isDragging = false }: DealCardProps) {
  const config = getStageConfig(deal.stage)

  return (
    <Link
      to={`/deals/${deal.id}`}
      aria-label={`Abrir detalhes do negócio ${deal.title}`}
      className={`block rounded-[18px] border bg-[var(--bg-card)] p-4 transition-all duration-200 hover:border-[var(--accent-ring)] ${
        isDragging
          ? 'rotate-2 border-[var(--accent-ring)] shadow-[0_24px_60px_-20px_rgba(124,58,237,0.55)]'
          : 'border-[var(--border-subtle)] shadow-[var(--shadow-card)]'
      }`}
    >
      <p className="line-clamp-2 text-[14px] font-semibold leading-snug text-[var(--text-primary)]">{deal.title}</p>
      {deal.service && <p className="mt-0.5 truncate text-[12px] text-[var(--text-muted)]">{deal.service}</p>}

      <p className="mt-3 font-display text-[20px] font-bold leading-none tracking-tight tabular-nums text-[var(--text-primary)]">
        {formatCurrency(deal.value)}
      </p>

      <div className="mt-3.5">
        <div className="flex items-center justify-between text-[11.5px] text-[var(--text-muted)]">
          <span>Chance de fechar</span>
          <span className="font-semibold tabular-nums text-[var(--text-secondary)]">{deal.probability}%</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-muted)]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${deal.probability}%`, background: `linear-gradient(90deg, ${config.color}99, ${config.color})` }}
          />
        </div>
      </div>

      {(deal.contact || deal.expected_close_date) && (
        <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-3">
          {deal.contact ? (
            <span className="flex min-w-0 items-center gap-2">
              <InitialsAvatar name={deal.contact.name} size="sm" />
              <span className="truncate text-[12.5px] text-[var(--text-secondary)]">{deal.contact.name}</span>
            </span>
          ) : (
            <span />
          )}
          {deal.expected_close_date && (
            <span className="flex shrink-0 items-center gap-1 text-[11.5px] text-[var(--text-muted)]" title="Fechamento previsto">
              <CalendarDays className="size-3.5" />
              {formatDate(deal.expected_close_date)}
            </span>
          )}
        </div>
      )}
    </Link>
  )
}
