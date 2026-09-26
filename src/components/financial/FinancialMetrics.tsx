import { motion } from 'motion/react'
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Clock, type LucideIcon } from 'lucide-react'
import { SilkRibbons } from '@/components/auth/SilkRibbons'
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

// Para despesas, subir é ruim: a cor segue o significado, não a seta.
function ChangePill({ value, inverse = false }: { value?: number; inverse?: boolean }) {
  if (value === undefined) return <span className="text-[12px] text-[var(--text-muted)]">Pagos neste mês</span>
  const direction = value > 0 ? 'up' : value < 0 ? 'down' : 'neutral'
  const good = inverse ? direction === 'down' : direction === 'up'
  const tone =
    direction === 'neutral'
      ? 'bg-[var(--bg-muted)] text-[var(--text-muted)]'
      : good
        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
        : 'bg-red-500/10 text-red-600 dark:text-red-400'
  return (
    <span className="flex items-center gap-2 text-[12px] text-[var(--text-muted)]">
      <span className={`rounded-full px-1.5 py-0.5 font-semibold ${tone}`}>
        {direction === 'up' ? '↑' : direction === 'down' ? '↓' : '·'} {Math.abs(value)}%
      </span>
      vs. mês anterior
    </span>
  )
}

function MetricCard({
  label,
  value,
  icon: Icon,
  tone,
  footer,
}: {
  label: string
  value: number
  icon: LucideIcon
  tone: string
  footer: React.ReactNode
}) {
  return (
    <motion.div
      variants={scaleIn}
      className="flex min-w-0 flex-col rounded-[var(--card-radius)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 shadow-[var(--shadow-card)] sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="truncate pt-2 text-[13px] font-medium text-[var(--text-secondary)]">{label}</p>
        <span className="hidden size-9 shrink-0 items-center justify-center rounded-xl sm:flex" style={{ backgroundColor: `${tone}1f`, color: tone }}>
          <Icon className="size-[17px]" />
        </span>
      </div>
      <p className="mt-2 truncate font-display text-[19px] font-bold leading-none tracking-tight tabular-nums text-[var(--text-primary)] sm:text-[26px]">
        <AnimatedCounter value={value} duration={0.8} format={formatCurrency} />
      </p>
      <div className="mt-auto hidden pt-4 sm:block">{footer}</div>
    </motion.div>
  )
}

export function FinancialMetrics({ metrics, loading, error, onRetry }: FinancialMetricsProps) {
  const reducedMotion = useReducedMotion()
  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />
  }

  if (loading || !metrics) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-[260px] rounded-[28px]" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[122px] rounded-[var(--card-radius)]" />
          ))}
        </div>
      </div>
    )
  }

  const balance = metrics.balance
  const monthResult = metrics.income_month - metrics.expense_month

  return (
    <motion.div
      initial={reducedMotion ? false : 'hidden'}
      animate="visible"
      variants={staggerContainer(0.07)}
      className="grid grid-cols-1 gap-4 lg:grid-cols-3"
    >
      {/* Saldo em destaque, no mesmo tecido roxo do resto do app. */}
      <motion.section
        variants={scaleIn}
        className="relative isolate flex min-h-[240px] flex-col justify-between overflow-hidden rounded-[28px] bg-[#0f0a1c] p-6 text-white ring-1 ring-white/[0.07]"
      >
        <div className="absolute inset-0 opacity-80" aria-hidden>
          <SilkRibbons className="h-full w-full animate-silk-drift" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(15,10,28,0.92)_30%,rgba(15,10,28,0.45))]" aria-hidden />

        <div className="relative">
          <p className="text-[13px] font-medium text-white/70">Saldo atual</p>
          <p className={`mt-2 font-display text-[38px] font-bold leading-none tracking-tight tabular-nums ${balance < 0 ? 'text-red-300' : ''}`}>
            <AnimatedCounter value={balance} duration={0.9} format={formatCurrency} />
          </p>
          <p className="mt-2 text-[12.5px] text-white/55">Tudo o que entrou menos tudo o que saiu (só o que já foi pago).</p>
        </div>

        <div className="relative mt-6 flex items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/[0.08] px-4 py-3 backdrop-blur-xl">
          <span className="text-[12.5px] text-white/70">Resultado do mês</span>
          <span className={`font-display text-[16px] font-semibold tabular-nums ${monthResult < 0 ? 'text-red-300' : 'text-emerald-300'}`}>
            {monthResult >= 0 ? '+' : '−'}
            {formatCurrency(Math.abs(monthResult))}
          </span>
        </div>
      </motion.section>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:col-span-2">
        <MetricCard
          label="Entrou este mês"
          value={metrics.income_month}
          icon={ArrowUpRight}
          tone="#34d399"
          footer={<ChangePill value={metrics.income_month_change} />}
        />
        <MetricCard
          label="Saiu este mês"
          value={metrics.expense_month}
          icon={ArrowDownRight}
          tone="#f87171"
          footer={<ChangePill value={metrics.expense_month_change} inverse />}
        />
        <MetricCard
          label="A receber"
          value={metrics.receivables_total}
          icon={Clock}
          tone="#fbbf24"
          footer={<span className="text-[12px] text-[var(--text-muted)]">Contas a receber em aberto</span>}
        />
        <MetricCard
          label="Em atraso"
          value={metrics.receivables_overdue}
          icon={AlertTriangle}
          tone="#f87171"
          footer={
            <span className="text-[12px] text-[var(--text-muted)]">
              {metrics.receivables_overdue > 0 ? 'Vale cobrar hoje' : 'Nada atrasado'}
            </span>
          }
        />
      </div>
    </motion.div>
  )
}
