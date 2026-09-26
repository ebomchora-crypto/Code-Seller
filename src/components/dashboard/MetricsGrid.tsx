import { motion } from 'motion/react'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { ErrorState } from '@/components/ui/ErrorState'
import { staggerContainer, scaleIn } from '@/utils/animations'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import type { DashboardMetric } from '@/types'

interface MetricsGridProps {
  metrics: DashboardMetric[]
  loading: boolean
  error?: string | null
  onRetry?: () => void
}

const GRID =
  'grid grid-cols-1 gap-4 sm:grid-cols-2 sm:[&>*:last-child]:col-span-2 xl:grid-cols-5 xl:[&>*:last-child]:col-span-1'

// A receita do mês fica no card de vidro do topo; aqui entram as demais.
export function MetricsGrid({ metrics, loading, error, onRetry }: MetricsGridProps) {
  const reducedMotion = useReducedMotion()
  if (loading) {
    return (
      <div className={GRID}>
        {Array.from({ length: 5 }).map((_, index) => (
          <MetricCard key={index} loading />
        ))}
      </div>
    )
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />
  }

  return (
    <motion.div initial={reducedMotion ? false : 'hidden'} animate="visible" variants={staggerContainer(0.06)} className={GRID}>
      {metrics.map((metric) => (
        <motion.div key={metric.label} variants={scaleIn} className="h-full">
          <MetricCard metric={metric} />
        </motion.div>
      ))}
    </motion.div>
  )
}
