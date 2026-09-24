import { motion } from 'motion/react'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import { scaleIn, staggerContainer } from '@/utils/animations'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { formatCurrency } from '@/utils/financial'
import type { FinancialMetrics as FinancialMetricsType } from '@/types'

interface FinancialMetricsProps {
  metrics: FinancialMetricsType | null
  loading: boolean
  error?: string | null
  onRetry?: () => void
}

function ChangeIndicator({ value }: { value?: number }) {
  if (value === undefined) return null
  const direction = value > 0 ? 'up' : value < 0 ? 'down' : 'neutral'

  return (
    <p
      className={`mt-2 text-xs font-medium ${
        direction === 'up' ? 'text-emerald-500' : direction === 'down' ? 'text-red-400' : 'text-[var(--text-muted)]'
      }`}
    >
      {direction === 'up' ? '↑' : direction === 'down' ? '↓' : '—'} {Math.abs(value)}% vs. mês anterior
    </p>
  )
}

function MetricCard({
  label,
  value,
  loading,
  negative = false,
  accentClass,
  change,
}: {
  label: string
  value: number
  loading: boolean
  negative?: boolean
  accentClass: string
  change?: number
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-3 h-7 w-28" />
      </div>
    )
  }

  return (
    <motion.div variants={scaleIn} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 transition-all duration-200 hover:border-[var(--border-default)] hover:shadow-[var(--shadow-card)]">
      <p className="label-caps">{label}</p>
      <p className={`mt-2 text-2xl font-bold tracking-tight ${negative ? 'text-red-500' : accentClass}`}>
        <AnimatedCounter value={value} duration={0.8} format={formatCurrency} />
      </p>
      <ChangeIndicator value={change} />
    </motion.div>
  )
}

export function FinancialMetrics({ metrics, loading, error, onRetry }: FinancialMetricsProps) {
  const reducedMotion = useReducedMotion()
  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />
  }

  const balance = metrics?.balance ?? 0

  return (
    <motion.div initial={reducedMotion ? false : 'hidden'} animate="visible" variants={staggerContainer(0.08)} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <MetricCard
        label="Saldo Atual"
        value={balance}
        loading={loading}
        negative={balance < 0}
        accentClass="text-purple-600"
      />
      <MetricCard
        label="Receita do Mês"
        value={metrics?.income_month ?? 0}
        loading={loading}
        accentClass="text-emerald-600"
        change={metrics?.income_month_change}
      />
      <MetricCard
        label="Despesa do Mês"
        value={metrics?.expense_month ?? 0}
        loading={loading}
        accentClass="text-red-500"
        change={metrics?.expense_month_change}
      />
      <MetricCard
        label="A Receber"
        value={metrics?.receivables_total ?? 0}
        loading={loading}
        accentClass="text-amber-600"
      />
      <MetricCard
        label="Em Atraso"
        value={metrics?.receivables_overdue ?? 0}
        loading={loading}
        accentClass="text-red-600"
      />
    </motion.div>
  )
}
