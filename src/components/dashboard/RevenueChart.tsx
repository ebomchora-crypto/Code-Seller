import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipContentProps } from 'recharts'
import { motion } from 'motion/react'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { PanelHeader } from '@/components/ui/PanelHeader'
import type { RevenueDataPoint } from '@/types'
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
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] px-3.5 py-2.5 shadow-[var(--shadow-modal)]">
      <p className="text-[11.5px] text-[var(--text-muted)]">{point.month_full}</p>
      <p className="mt-0.5 font-display text-[15px] font-semibold text-[var(--text-primary)]">{formatFullBRL(point.value)}</p>
    </div>
  )
}

export function RevenueChart({ data, loading, error, onRetry }: RevenueChartProps) {
  const hasRevenue = data.some((point) => point.value > 0)
  const total = data.reduce((sum, point) => sum + point.value, 0)
  const { ref, isInView } = useRevealOnScroll<HTMLDivElement>()
  const reducedMotion = useReducedMotion()

  return (
    <motion.div ref={ref} initial="hidden" animate={isInView ? 'visible' : 'hidden'} variants={fadeInUp} className="h-full">
      <Card className="h-full">
        <PanelHeader
          title="Receita mensal"
          subtitle={`Negócios ganhos nos últimos ${data.length || 6} meses`}
          action={
            hasRevenue && !loading ? (
              <div className="text-right">
                <p className="font-display text-[20px] font-bold leading-none tracking-tight text-[var(--text-primary)]">
                  {formatFullBRL(total)}
                </p>
                <p className="mt-1 text-[12px] text-[var(--text-muted)]">no período</p>
              </div>
            ) : undefined
          }
        />

        {loading ? (
          <Skeleton className="h-64 w-full rounded-2xl" />
        ) : error ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : !hasRevenue ? (
          <div className="flex h-64 items-center justify-center">
            <EmptyState title="Nenhuma receita registrada ainda" description="Feche seu primeiro negócio para ver os dados aqui." />
          </div>
        ) : (
          <div className="h-64 animate-fade-in">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="revenueStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="60%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#d946ef" />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border-subtle)" strokeDasharray="4 6" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={8} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                  tickFormatter={formatCompactBRL}
                  width={56}
                />
                <Tooltip
                  content={(props) => <CustomTooltip {...props} />}
                  cursor={{ stroke: 'var(--border-strong)', strokeDasharray: '4 4' }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="url(#revenueStroke)"
                  strokeWidth={2.5}
                  fill="url(#revenueFill)"
                  activeDot={{ r: 5, fill: '#8b5cf6', stroke: 'var(--bg-card)', strokeWidth: 3 }}
                  isAnimationActive={!reducedMotion}
                  animationDuration={700}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </motion.div>
  )
}
