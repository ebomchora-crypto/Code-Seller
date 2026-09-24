import { Link } from 'react-router-dom'
import { formatCurrency, getStageConfig } from '@/utils/deals'
import type { Deal } from '@/types'

interface DealCardProps {
  deal: Deal
  isDragging?: boolean
}

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR')
}

export function DealCard({ deal, isDragging = false }: DealCardProps) {
  const config = getStageConfig(deal.stage)

  return (
    <Link
      to={`/deals/${deal.id}`}
      aria-label={`Abrir detalhes do negócio ${deal.title}`}
      style={{ borderLeftColor: config.color, borderLeftWidth: 3 }}
      className={`block rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 transition-all duration-200 hover:border-purple-300/40 hover:shadow-[var(--shadow-card)] ${
        isDragging ? 'rotate-2 opacity-95 shadow-[0_16px_50px_rgba(179,92,255,0.20)]' : ''
      }`}
    >
      <p className="truncate text-sm font-medium text-[var(--text-primary)]">{deal.title}</p>
      {deal.contact && <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">{deal.contact.name}</p>}
      <p className="mt-1 text-sm font-medium text-[var(--text-secondary)]">{formatCurrency(deal.value)}</p>
      {deal.service && <p className="mt-0.5 text-xs text-[var(--text-muted)]">{deal.service}</p>}
      {deal.expected_close_date && (
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">Previsão: {formatDate(deal.expected_close_date)}</p>
      )}

      <div className="mt-3">
        <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--bg-muted)]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${deal.probability}%`, backgroundColor: config.color }}
          />
        </div>
        <p className="mt-1 text-[11px] text-[var(--text-muted)]">{deal.probability}% de probabilidade</p>
      </div>
    </Link>
  )
}
