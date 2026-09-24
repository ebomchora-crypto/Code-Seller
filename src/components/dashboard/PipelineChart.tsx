import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipContentProps } from 'recharts'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { getStageConfig } from '@/utils/deals'
import type { PipelineDataPoint } from '@/types'
import { motion } from 'motion/react'
import { useRevealOnScroll } from '@/hooks/useScrollAnimation'
import { fadeInUp } from '@/utils/animations'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface PipelineChartProps {
  data: PipelineDataPoint[]
  loading?: boolean
  error?: string | null
  onRetry?: () => void
}

function formatFullBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function CustomTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0].payload as PipelineDataPoint

  return (
    <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-2 shadow-[var(--shadow-modal)]">
      <p className="text-xs text-[var(--text-muted)]">{point.label}</p>
      <p className="text-sm font-medium text-[var(--text-primary)]">
        {point.count} {point.count === 1 ? 'negócio' : 'negócios'}
      </p>
      <p className="text-xs text-[var(--text-muted)]">{formatFullBRL(point.value)}</p>
    </div>
  )
}

export function PipelineChart({ data, loading, error, onRetry }: PipelineChartProps) {
  const hasDeals = data.some((point) => point.count > 0)
  const { ref, isInView } = useRevealOnScroll<HTMLDivElement>()
  const reducedMotion = useReducedMotion()

  return (
    <motion.div ref={ref} initial="hidden" animate={isInView ? 'visible' : 'hidden'} variants={fadeInUp}>
    <Card>
      <div className="mb-6">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">Pipeline por Etapa</h3>
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : !hasDeals ? (
        <div className="flex h-64 items-center justify-center">
          <EmptyState title="Nenhum negócio em andamento" />
        </div>
      ) : (
        <div className="h-64 animate-fade-in">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="label"
                axisLine={false}
                tickLine={false}
                width={90}
                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              />
              <Tooltip content={(props) => <CustomTooltip {...props} />} cursor={{ fill: 'var(--bg-muted)' }} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} isAnimationActive={!reducedMotion} animationDuration={600} barSize={20}>
                {data.map((point) => (
                  <Cell key={point.stage} fill={getStageConfig(point.stage).color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
    </motion.div>
  )
}
