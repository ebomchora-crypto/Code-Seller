import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { TooltipContentProps } from 'recharts'
import { Card } from '@/components/ui/Card'
import { PanelHeader } from '@/components/ui/PanelHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { formatCurrency } from '@/utils/financial'
import type { CashFlowDataPoint } from '@/types'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface CashFlowChartProps {
  data: CashFlowDataPoint[]
  loading?: boolean
  error?: string | null
  onRetry?: () => void
}

function formatCompactBRL(value: number): string {
  const sign = value < 0 ? '-' : ''
  const abs = Math.abs(value)
  if (abs >= 1000) return `${sign}R$ ${Math.round(abs / 1000)}k`
  return `${sign}R$ ${abs}`
}

function CustomTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0].payload as CashFlowDataPoint

  return (
    <div className="min-w-[180px] rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] px-3.5 py-3 shadow-[var(--shadow-modal)]">
      <p className="mb-2 text-[11.5px] text-[var(--text-muted)]">{point.month_full}</p>
      {[
        { label: 'Entrou', value: point.income, color: '#34d399' },
        { label: 'Saiu', value: point.expense, color: '#f87171' },
        { label: 'Saldo', value: point.balance, color: '#a78bfa' },
      ].map((row) => (
        <p key={row.label} className="flex items-center justify-between gap-4 text-[12.5px]">
          <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
            <span className="size-2 rounded-full" style={{ backgroundColor: row.color }} />
            {row.label}
          </span>
          <span className="font-semibold tabular-nums text-[var(--text-primary)]">{formatCurrency(row.value)}</span>
        </p>
      ))}
    </div>
  )
}

export function CashFlowChart({ data, loading, error, onRetry }: CashFlowChartProps) {
  const hasData = data.some((point) => point.income > 0 || point.expense > 0)
  const reducedMotion = useReducedMotion()

  return (
    <Card>
      <PanelHeader
        title="Fluxo de caixa"
        subtitle="Entradas, saídas e saldo acumulado nos últimos 6 meses"
        action={
          <div className="hidden items-center gap-4 text-[12.5px] text-[var(--text-secondary)] sm:flex">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-400" /> Entrou
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-red-400" /> Saiu
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-3 rounded-full bg-[#a78bfa]" /> Saldo
            </span>
          </div>
        }
      />

      {loading ? (
        <Skeleton className="h-72 w-full rounded-2xl" />
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : !hasData ? (
        <div className="flex h-72 items-center justify-center">
          <EmptyState
            title="Nenhuma movimentação registrada ainda"
            description="Registre suas primeiras transações para ver o fluxo de caixa aqui."
          />
        </div>
      ) : (
        <>
          <div className="h-72 animate-fade-in">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="cashIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                  <linearGradient id="cashExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fb7185" />
                    <stop offset="100%" stopColor="#dc2626" />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border-subtle)" strokeDasharray="4 6" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={8} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                  tickFormatter={formatCompactBRL}
                  width={60}
                />
                <Tooltip content={(props) => <CustomTooltip {...props} />} cursor={{ fill: 'var(--bg-muted)', opacity: 0.5 }} />
                <Bar dataKey="income" fill="url(#cashIncome)" radius={[6, 6, 0, 0]} barSize={18} isAnimationActive={!reducedMotion} animationDuration={600} />
                <Bar dataKey="expense" fill="url(#cashExpense)" radius={[6, 6, 0, 0]} barSize={18} isAnimationActive={!reducedMotion} animationDuration={600} />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="#a78bfa"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#a78bfa', strokeWidth: 0 }}
                  isAnimationActive={!reducedMotion}
                  animationDuration={600}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

        </>
      )}
    </Card>
  )
}
