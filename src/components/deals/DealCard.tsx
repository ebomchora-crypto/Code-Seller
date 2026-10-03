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

function isLate(value: string): boolean {
  return new Date(`${value}T23:59:59`).getTime() < Date.now()
}

// Cartão enxuto: as colunas do quadro são estreitas, então cada informação
// tem a sua linha (título, valor + chance, contato + data) e nada briga por espaço.
export function DealCard({ deal, isDragging = false }: DealCardProps) {
  const config = getStageConfig(deal.stage)
  const showService = deal.service && deal.service.trim().toLowerCase() !== deal.title.trim().toLowerCase()
  const late = deal.expected_close_date ? isLate(deal.expected_close_date) : false

  return (
    <Link
      to={`/deals/${deal.id}`}
      aria-label={`Abrir detalhes do negócio ${deal.title}`}
      className={`group relative block overflow-hidden rounded-2xl border bg-[var(--bg-card)] p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent-ring)] ${
        isDragging
          ? 'rotate-2 border-[var(--accent-ring)] shadow-[0_24px_60px_-20px_rgba(124,58,237,0.55)]'
          : 'border-[var(--border-subtle)] shadow-[var(--shadow-card)]'
      }`}
    >
      <span className="absolute inset-y-3 left-0 w-[3px] rounded-r-full" style={{ backgroundColor: config.color }} aria-hidden />

      <p className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-[var(--text-primary)]" title={deal.title}>
        {deal.title}
      </p>
      {showService && <p className="mt-0.5 truncate text-[11.5px] text-[var(--text-muted)]">{deal.service}</p>}

      <div className="mt-2.5 flex items-baseline justify-between gap-2">
        <p className="font-display text-[17px] font-bold leading-none tracking-tight tabular-nums text-[var(--text-primary)]">
          {formatCurrency(deal.value, deal.currency)}
        </p>
        <span className="shrink-0 text-[11.5px] font-semibold tabular-nums" style={{ color: config.color }} title="Chance de fechar">
          {deal.probability}%
        </span>
      </div>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[var(--bg-muted)]" title={`${deal.probability}% de chance de fechar`}>
        <div className="h-full rounded-full" style={{ width: `${deal.probability}%`, backgroundColor: config.color }} />
      </div>

      {(deal.contact || deal.expected_close_date) && (
        <div className="mt-3 flex flex-col gap-1.5 text-[12px]">
          {deal.contact && (
            <span className="flex min-w-0 items-center gap-2 text-[var(--text-secondary)]">
              <InitialsAvatar name={deal.contact.name} size="xs" />
              <span className="truncate" title={deal.contact.name}>
                {deal.contact.name}
              </span>
            </span>
          )}
          {deal.expected_close_date && (
            <span
              className={`flex items-center gap-1.5 ${late ? 'text-red-500 dark:text-red-400' : 'text-[var(--text-muted)]'}`}
              title="Fechamento previsto"
            >
              <CalendarDays className="size-3.5 shrink-0" />
              {late ? `Atrasado · ${formatDate(deal.expected_close_date)}` : `Fecha ${formatDate(deal.expected_close_date)}`}
            </span>
          )}
        </div>
      )}
    </Link>
  )
}
