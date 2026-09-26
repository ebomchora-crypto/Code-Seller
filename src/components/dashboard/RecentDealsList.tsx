import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Button } from '@/components/ui/Button'
import { StageBadge } from '@/components/deals/StageBadge'
import { PanelHeader, PanelLink } from '@/components/ui/PanelHeader'
import { InitialsAvatar } from '@/components/ui/InitialsAvatar'
import { formatCurrency } from '@/utils/deals'
import type { Deal } from '@/types'
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
    <Card className="h-full">
      <PanelHeader
        title="Negócios em andamento"
        subtitle="Os que andaram por último"
        action={<PanelLink to="/deals">Ver todos</PanelLink>}
      />

      {loading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <Skeleton className="size-10 shrink-0 rounded-xl" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : deals.length === 0 ? (
        <EmptyState title="Nenhum negócio em andamento" action={<Button size="sm" onClick={onCreateDeal}>Criar negócio</Button>} />
      ) : (
        <motion.ul initial={reducedMotion ? false : 'hidden'} animate="visible" variants={staggerContainer(0.04)} className="-mx-2 flex flex-col gap-1">
          {deals.map((deal, index) => (
            <motion.li key={deal.id} variants={index < 8 ? fadeInUp : undefined}>
              <Link
                to={`/deals/${deal.id}`}
                className="flex items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors duration-150 hover:bg-[var(--bg-muted)]"
              >
                <InitialsAvatar name={deal.contact?.name ?? deal.title} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-[var(--text-primary)]">{deal.title}</p>
                  <p className="mt-0.5 truncate text-[12.5px] text-[var(--text-muted)]">{deal.contact?.name ?? 'Sem contato'}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="font-display text-[14px] font-semibold tabular-nums text-[var(--text-primary)]">
                    {formatCurrency(deal.value)}
                  </span>
                  <StageBadge stage={deal.stage} />
                </div>
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </Card>
  )
}
