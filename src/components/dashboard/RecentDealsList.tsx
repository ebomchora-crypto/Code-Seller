import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Button } from '@/components/ui/Button'
import { StageBadge } from '@/components/deals/StageBadge'
import { formatCurrency } from '@/utils/deals'
import type { Deal } from '@/types'
import { motion } from 'motion/react'
import { fadeInUp, staggerContainer } from '@/utils/animations'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface RecentDealsListProps {
  deals: Deal[]
  loading: boolean
  error?: string | null
  onRetry?: () => void
  onCreateDeal: () => void
}

export function RecentDealsList({ deals, loading, error, onRetry, onCreateDeal }: RecentDealsListProps) {
  const reducedMotion = useReducedMotion()
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">Negócios em Andamento</h3>
        <Link to="/deals" className="text-sm text-purple-500 transition-colors hover:text-purple-600">
          Ver todos →
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[70, 55, 80, 45, 65].map((width, index) => (
            <div key={index} className="flex items-center justify-between">
              <Skeleton className="h-4" style={{ width: `${width}%` }} />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : deals.length === 0 ? (
        <EmptyState
          title="Nenhum negócio em andamento"
          action={<Button size="sm" onClick={onCreateDeal}>Criar negócio</Button>}
        />
      ) : (
        <motion.ul initial={reducedMotion ? false : 'hidden'} animate="visible" variants={staggerContainer(0.04)} className="divide-y divide-[var(--border-subtle)]">
          {deals.map((deal, index) => (
            <motion.li key={deal.id} variants={index < 8 ? fadeInUp : undefined}>
              <Link
                to={`/deals/${deal.id}`}
                className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-3 transition-colors duration-150 hover:bg-accent-soft/40 dark:hover:bg-accent-bright/10"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--text-primary)]">{deal.title}</p>
                  <div className="mt-1 flex items-center gap-2">
                    {deal.contact && <span className="text-xs text-[var(--text-muted)]">{deal.contact.name}</span>}
                    <StageBadge stage={deal.stage} />
                  </div>
                </div>
                <span className="shrink-0 text-sm font-medium text-[var(--text-primary)]">
                  {formatCurrency(deal.value)}
                </span>
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </Card>
  )
}
