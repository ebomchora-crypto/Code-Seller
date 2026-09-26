import { Briefcase, CheckSquare, DollarSign, Target, TrendingUp, Users, type LucideIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tooltip } from '@/components/ui/Tooltip'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import type { DashboardMetric } from '@/types'

interface MetricCardProps {
  metric?: DashboardMetric
  loading?: boolean
}

const ICONS: Record<string, LucideIcon> = {
  DollarSign,
  Briefcase,
  TrendingUp,
  Target,
  Users,
  CheckSquare,
}

// Métricas de "estoque" não têm variação real (ver dashboard.ts) — no lugar
// dela, uma legenda curta explica de onde sai o número.
const CAPTIONS: Record<string, string> = {
  Briefcase: 'Em andamento agora',
  TrendingUp: 'Soma dos negócios abertos',
  Target: 'Ganhos nos últimos 90 dias',
  CheckSquare: 'A fazer e em andamento',
}

// Cada card tem um tom próprio, sempre dentro da família roxa/fria da marca.
const TONES: Record<string, string> = {
  Briefcase: '#a78bfa',
  TrendingUp: '#818cf8',
  Target: '#e879f9',
  Users: '#60a5fa',
  CheckSquare: '#34d399',
  DollarSign: '#a78bfa',
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

export function MetricCard({ metric, loading }: MetricCardProps) {
  if (loading || !metric) {
    return (
      <div className="rounded-[var(--card-radius)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="size-9 rounded-xl" />
        </div>
        <Skeleton className="mt-5 h-8 w-28" />
        <Skeleton className="mt-3 h-3 w-32" />
      </div>
    )
  }

  const Icon = ICONS[metric.icon] ?? Target
  const tone = TONES[metric.icon] ?? '#a78bfa'
  const change = metric.change

  const card = (
    <div className="group relative h-full overflow-hidden rounded-[var(--card-radius)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--border-default)]">
      <div
        className="pointer-events-none absolute -right-10 -top-12 size-32 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-40"
        style={{ backgroundColor: tone }}
        aria-hidden
      />

      <div className="relative flex items-start justify-between gap-3">
        <p className="min-w-0 truncate pt-2 text-[13px] font-medium text-[var(--text-secondary)]" title={metric.label}>
          {metric.label}
        </p>
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${tone}1f`, color: tone }}
        >
          <Icon className="size-[17px]" />
        </span>
      </div>

      <p className="relative mt-3 font-display text-[28px] font-bold leading-none tracking-tight text-[var(--text-primary)]">
        {metric.value === '—' ? (
          '—'
        ) : (
          <AnimatedCounter value={metric.raw_value} duration={800} format={(value) => formatAnimatedValue(metric, value)} />
        )}
      </p>

      <div className="relative mt-4 flex items-center gap-2 text-[12px] text-[var(--text-muted)]">
        {change ? (
          <>
            <span
              className={`shrink-0 whitespace-nowrap rounded-full px-1.5 py-0.5 font-semibold ${
                change.direction === 'up'
                  ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400'
                  : change.direction === 'down'
                    ? 'bg-red-500/10 text-red-500 dark:text-red-400'
                    : 'bg-[var(--bg-muted)] text-[var(--text-muted)]'
              }`}
            >
              {change.direction === 'up' ? '↑' : change.direction === 'down' ? '↓' : '·'} {change.value}%
            </span>
            <span className="truncate">{change.label}</span>
          </>
        ) : (
          CAPTIONS[metric.icon]
        )}
      </div>
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
