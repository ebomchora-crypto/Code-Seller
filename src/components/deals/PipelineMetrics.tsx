import { Briefcase, Receipt, Target, Wallet, type LucideIcon } from 'lucide-react'
import { useCountUp } from '@/hooks/useCountUp'
import { formatCurrency } from '@/utils/deals'
import type { PipelineMetrics as PipelineMetricsType } from '@/types'

interface PipelineMetricsProps {
  metrics: PipelineMetricsType
  activeDealsCount: number
}

function MetricCard({ label, value, caption, icon: Icon, tone }: { label: string; value: string; caption: string; icon: LucideIcon; tone: string }) {
  return (
    <div className="min-w-0 rounded-[var(--card-radius)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 shadow-[var(--shadow-card)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate pt-2 text-[13px] font-medium text-[var(--text-secondary)]">{label}</p>
        <span className="hidden size-9 shrink-0 items-center justify-center rounded-xl sm:flex" style={{ backgroundColor: `${tone}1f`, color: tone }}>
          <Icon className="size-[17px]" />
        </span>
      </div>
      <p className="mt-2 truncate font-display text-[19px] font-bold sm:mt-3 sm:text-[26px] leading-none tracking-tight tabular-nums text-[var(--text-primary)]">{value}</p>
      <p className="mt-3 hidden truncate text-[12px] text-[var(--text-muted)] sm:block">{caption}</p>
    </div>
  )
}

export function PipelineMetrics({ metrics, activeDealsCount }: PipelineMetricsProps) {
  const openValue = useCountUp(metrics.open_value)
  const activeCount = useCountUp(activeDealsCount)
  const conversionRate = useCountUp(metrics.conversion_rate)
  const avgDealValue = useCountUp(metrics.avg_deal_value)

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      <MetricCard label="Em aberto" value={formatCurrency(openValue)} caption="Soma dos negócios em andamento" icon={Wallet} tone="#a78bfa" />
      <MetricCard label="Negócios ativos" value={Math.round(activeCount).toString()} caption="Em andamento agora" icon={Briefcase} tone="#818cf8" />
      <MetricCard label="Conversão" value={`${conversionRate.toFixed(1)}%`} caption="Ganhos sobre os já decididos" icon={Target} tone="#e879f9" />
      <MetricCard label="Ticket médio" value={formatCurrency(avgDealValue)} caption="Média dos negócios ganhos" icon={Receipt} tone="#34d399" />
    </div>
  )
}
