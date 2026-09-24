import { useCountUp } from '@/hooks/useCountUp'
import { formatCurrency } from '@/utils/deals'
import type { PipelineMetrics as PipelineMetricsType } from '@/types'

interface PipelineMetricsProps {
  metrics: PipelineMetricsType
  activeDealsCount: number
}

function MetricCard({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <p className="label-caps">{label}</p>
      <p className={`mt-2 text-2xl font-medium tracking-tightest ${highlight ? 'text-purple-600' : 'text-neutral-900'}`}>
        {value}
      </p>
    </div>
  )
}

export function PipelineMetrics({ metrics, activeDealsCount }: PipelineMetricsProps) {
  const openValue = useCountUp(metrics.open_value)
  const activeCount = useCountUp(activeDealsCount)
  const conversionRate = useCountUp(metrics.conversion_rate)
  const avgDealValue = useCountUp(metrics.avg_deal_value)

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <MetricCard label="Total em aberto" value={formatCurrency(openValue)} highlight />
      <MetricCard label="Deals ativos" value={Math.round(activeCount).toString()} />
      <MetricCard label="Taxa de conversão" value={`${conversionRate.toFixed(1)}%`} />
      <MetricCard label="Ticket médio" value={formatCurrency(avgDealValue)} />
    </div>
  )
}
