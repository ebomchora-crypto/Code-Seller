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
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow-md">
      <p className="mb-1 text-xs text-neutral-500">{point.month_full}</p>
      <p className="text-xs text-emerald-600">Receita: {formatCurrency(point.income)}</p>
      <p className="text-xs text-red-500">Despesa: {formatCurrency(point.expense)}</p>
      <p className="mt-1 text-xs font-medium text-purple-600">Saldo: {formatCurrency(point.balance)}</p>
    </div>
  )
}

export function CashFlowChart({ data, loading, error, onRetry }: CashFlowChartProps) {
  const hasData = data.some((point) => point.income > 0 || point.expense > 0)
  const reducedMotion = useReducedMotion()

  return (
    <Card>
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="text-base font-medium text-neutral-900">Fluxo de Caixa</h3>
        <span className="text-xs text-neutral-400">Últimos 6 meses</span>
      </div>

      {loading ? (
        <Skeleton className="h-72 w-full" />
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
                <CartesianGrid vertical={false} stroke="var(--border-subtle)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                  tickFormatter={formatCompactBRL}
                  width={60}
                />
                <Tooltip content={(props) => <CustomTooltip {...props} />} />
                <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={16} isAnimationActive={!reducedMotion} animationDuration={600} />
                <Bar dataKey="expense" fill="#f87171" radius={[4, 4, 0, 0]} barSize={16} isAnimationActive={!reducedMotion} animationDuration={600} />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="#b35cff"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={!reducedMotion}
                  animationDuration={600}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 flex items-center justify-center gap-6 text-xs text-neutral-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Receita
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-400" /> Despesa
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-accent-bright" /> Saldo
            </span>
          </div>
        </>
      )}
    </Card>
  )
}
