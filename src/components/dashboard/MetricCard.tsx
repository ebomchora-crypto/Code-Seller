import { Briefcase, CheckSquare, DollarSign, Target, TrendingUp, Users, type LucideIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tooltip } from '@/components/ui/Tooltip'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import type { DashboardMetric } from '@/types'

interface MetricCardProps {
  metric?: DashboardMetric
  loading?: boolean
  /** Destaque visual sutil (roxo) — reservado para o card de receita, sempre
   * na primeira posição do grid. Ignora `metric.accent` de propósito: o
   * sistema de ícones foi padronizado para neutro, com exceção só aqui. */
  highlight?: boolean
}

const ICONS: Record<string, LucideIcon> = {
  DollarSign,
  Briefcase,
  TrendingUp,
  Target,
  Users,
  CheckSquare,
}

function formatAnimatedValue(metric: DashboardMetric, animated: number): string {
  if (metric.value === '—') return '—'
  if (metric.value.startsWith('R$')) {
    return animated.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
  }
  if (metric.value.endsWith('%')) {
    return `${Math.round(animated)}%`
  }
  return Math.round(animated).toString()
}

export function MetricCard({ metric, loading, highlight = false }: MetricCardProps) {
  if (loading || !metric) {
    return (
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="mt-4 h-7 w-24" />
        <Skeleton className="mt-2 h-3 w-32" />
      </div>
    )
  }

  const Icon = ICONS[metric.icon] ?? Target

  const card = (
    <div
      className={`animate-fade-in relative overflow-hidden rounded-2xl border p-6 transition-all duration-200 ${
        highlight
          ? 'border-[var(--purple-border)] hover:shadow-[0_0_30px_rgba(179,92,255,0.08)]'
          : 'border-[var(--border-subtle)] hover:border-[var(--border-default)] hover:shadow-[var(--shadow-card)]'
      } bg-[var(--bg-card)]`}
    >
      {highlight && (
        <div className="pointer-events-none absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-accent-bright/10 blur-2xl" />
      )}

      <div className="relative flex items-center justify-between">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
            highlight ? 'bg-[var(--purple-soft)] text-purple-500' : 'bg-[var(--bg-muted)] text-[var(--text-secondary)]'
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>

        {metric.change && (
          <span
            className={`flex items-center gap-0.5 text-xs font-medium ${
              metric.change.direction === 'up'
                ? 'text-emerald-500'
                : metric.change.direction === 'down'
                  ? 'text-red-400'
                  : 'text-[var(--text-muted)]'
            }`}
          >
            {metric.change.direction === 'up' ? '↑' : metric.change.direction === 'down' ? '↓' : '—'}{' '}
            {metric.change.value}%
          </span>
        )}
      </div>

      <p className="relative mt-4 font-display text-3xl font-bold leading-none tracking-tight text-[var(--text-primary)]">
        {metric.value === '—' ? (
          '—'
        ) : (
          <AnimatedCounter value={metric.raw_value} duration={800} format={(value) => formatAnimatedValue(metric, value)} />
        )}
      </p>
      <p className="relative mt-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
        {metric.label}
      </p>

      {metric.change && (
        <p className="relative mt-3 border-t border-[var(--border-subtle)] pt-3 text-xs text-[var(--text-muted)]">
          {metric.change.label}
        </p>
      )}
    </div>
  )

  if (metric.tooltip) {
    return (
      <Tooltip content={metric.tooltip}>
        <div className="w-full">{card}</div>
      </Tooltip>
    )
  }

  return card
}
