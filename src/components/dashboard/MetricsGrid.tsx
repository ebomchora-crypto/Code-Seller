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

export function MetricsGrid({ metrics, loading, error, onRetry }: MetricsGridProps) {
  const reducedMotion = useReducedMotion()
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <MetricCard key={index} metric={metrics[index]} loading />
        ))}
      </div>
    )
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />
  }

  return (
    <motion.div
      initial={reducedMotion ? false : 'hidden'}
      animate="visible"
      variants={staggerContainer(0.08)}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {metrics.map((metric, index) => (
        <motion.div key={metric.label} variants={scaleIn}>
          <MetricCard metric={metric} highlight={index === 0} />
        </motion.div>
      ))}
    </motion.div>
  )
}
