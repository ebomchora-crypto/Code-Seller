import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipContentProps } from 'recharts'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import type { RevenueDataPoint } from '@/types'
import { motion } from 'motion/react'
import { useRevealOnScroll } from '@/hooks/useScrollAnimation'
import { fadeInUp } from '@/utils/animations'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface RevenueChartProps {
  data: RevenueDataPoint[]
  loading?: boolean
  error?: string | null
  onRetry?: () => void
}

function formatCompactBRL(value: number): string {
  if (value >= 1000) return `R$ ${Math.round(value / 1000)}k`
  return `R$ ${value}`
}

function formatFullBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function CustomTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0].payload as RevenueDataPoint

  return (
    <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-2 shadow-[var(--shadow-modal)]">
      <p className="text-xs text-[var(--text-muted)]">{point.month_full}</p>
      <p className="text-sm font-medium text-[var(--text-primary)]">{formatFullBRL(point.value)}</p>
    </div>
  )
}

export function RevenueChart({ data, loading, error, onRetry }: RevenueChartProps) {
  const hasRevenue = data.some((point) => point.value > 0)
  const { ref, isInView } = useRevealOnScroll<HTMLDivElement>()
  const reducedMotion = useReducedMotion()

  return (
    <motion.div ref={ref} initial="hidden" animate={isInView ? 'visible' : 'hidden'} variants={fadeInUp}>
    <Card>
      <div className="mb-6 flex items-baseline justify-between">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">Receita Mensal</h3>
        <span className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Últimos 6 meses</span>
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : !hasRevenue ? (
        <div className="flex h-64 items-center justify-center">
          <EmptyState
            title="Nenhuma receita registrada ainda"
            description="Feche seu primeiro negócio para ver os dados aqui."
          />
        </div>
      ) : (
        <div className="h-64 animate-fade-in">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#b35cff" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#b35cff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border-subtle)" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                tickFormatter={formatCompactBRL}
                width={56}
              />
              <Tooltip content={(props) => <CustomTooltip {...props} />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#b35cff"
                strokeWidth={2}
                fill="url(#revenueGradient)"
                isAnimationActive={!reducedMotion}
                animationDuration={600}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
    </motion.div>
  )
}
