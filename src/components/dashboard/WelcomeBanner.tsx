import { Plus, RefreshCw, UserPlus } from 'lucide-react'
import { motion } from 'motion/react'
import { SilkRibbons } from '@/components/auth/SilkRibbons'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import { EASE_PREMIUM } from '@/utils/animations'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import type { DashboardMetric, RevenueDataPoint } from '@/types'

interface WelcomeBannerProps {
  userName: string
  lastUpdated: Date | null
  onRefresh: () => void
  refreshing: boolean
  loading?: boolean
  revenue?: DashboardMetric
  revenueSeries: RevenueDataPoint[]
  onNewContact: () => void
  onNewDeal: () => void
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function formatDate(date: Date): string {
  const formatted = date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

const SPARK_WIDTH = 248
const SPARK_HEIGHT = 56

// Linha suave dos últimos meses de receita, desenhada à mão (sem recharts) —
// é só um traço decorativo dentro do card de vidro.
function sparkPaths(series: RevenueDataPoint[]) {
  const values = series.map((point) => point.value)
  const max = Math.max(...values, 1)
  const step = values.length > 1 ? SPARK_WIDTH / (values.length - 1) : SPARK_WIDTH
  const points = values.map((value, index) => ({
    x: index * step,
    y: SPARK_HEIGHT - 6 - (value / max) * (SPARK_HEIGHT - 14),
  }))
  const line = points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`
    const previous = points[index - 1]
    const midX = (previous.x + point.x) / 2
    return `${path} C ${midX} ${previous.y}, ${midX} ${point.y}, ${point.x} ${point.y}`
  }, '')
  return { line, area: `${line} L ${SPARK_WIDTH} ${SPARK_HEIGHT} L 0 ${SPARK_HEIGHT} Z`, last: points[points.length - 1] }
}

function RevenueGlass({ revenue, series, loading }: { revenue?: DashboardMetric; series: RevenueDataPoint[]; loading?: boolean }) {
  const hasSeries = series.some((point) => point.value > 0)
  const spark = hasSeries ? sparkPaths(series) : null
  const change = revenue?.change

  return (
    <div className="w-full rounded-[22px] border border-white/15 bg-white/[0.08] p-5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:w-[296px]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-medium text-white/70">Receita do mês</p>
        {change && change.direction !== 'neutral' && (
          <span
            className={`rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${
              change.direction === 'up' ? 'bg-emerald-400/15 text-emerald-300' : 'bg-red-400/15 text-red-300'
            }`}
          >
            {change.direction === 'up' ? '↑' : '↓'} {change.value}%
          </span>
        )}
      </div>

      {loading || !revenue ? (
        <div className="mt-3 h-9 w-40 animate-pulse rounded-lg bg-white/10" />
      ) : (
        <p className="mt-2 font-display text-[34px] font-bold leading-none tracking-tight">
          <AnimatedCounter value={revenue.raw_value} duration={900} format={formatBRL} />
        </p>
      )}

      <div className="mt-4 h-14">
        {spark && (
          <svg viewBox={`0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}`} className="h-full w-full overflow-visible" preserveAspectRatio="none" aria-hidden>
            <defs>
              <linearGradient id="hero-spark-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#ffffff" stopOpacity="0.28" />
                <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={spark.area} fill="url(#hero-spark-fill)" />
            <path d={spark.line} fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            <circle cx={spark.last.x} cy={spark.last.y} r="4" fill="#ffffff" />
          </svg>
        )}
      </div>

      <p className="mt-2 text-[12px] text-white/55">
        {change ? change.label : 'Negócios ganhos neste mês'}
        {hasSeries && ` · últimos ${series.length} meses`}
      </p>
    </div>
  )
}

// Topo do Dashboard: mesmo tecido roxo das telas de acesso, com a saudação,
// as ações rápidas e a receita do mês num card de vidro.
export function WelcomeBanner({
  userName,
  lastUpdated,
  onRefresh,
  refreshing,
  loading,
  revenue,
  revenueSeries,
  onNewContact,
  onNewDeal,
}: WelcomeBannerProps) {
  const reducedMotion = useReducedMotion()
  const reveal = (delay: number) => ({
    initial: reducedMotion ? false : { opacity: 0, y: 18, filter: 'blur(6px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    transition: { duration: 0.8, ease: EASE_PREMIUM, delay },
  })

  return (
    <section className="relative isolate overflow-hidden rounded-[28px] bg-[#0f0a1c] text-white ring-1 ring-white/[0.07]">
      <div
        className="absolute inset-y-0 right-0 w-full md:w-[72%]"
        style={{ maskImage: 'linear-gradient(90deg, transparent, #000 38%)', WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 38%)' }}
        aria-hidden
      >
        <SilkRibbons className="h-full w-full animate-silk-drift" />
      </div>
      <div
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,10,28,0.88)_35%,rgba(15,10,28,0.45))] md:bg-[linear-gradient(90deg,#0f0a1c_18%,rgba(15,10,28,0.55)_55%,rgba(15,10,28,0.1))]"
        aria-hidden
      />

      <div className="relative flex flex-col gap-8 p-6 sm:p-9 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl">
          <motion.div {...reveal(0)} className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1 text-[12.5px] text-white/80 backdrop-blur-md">
              <span className="size-1.5 rounded-full bg-[#c4b5fd] shadow-[0_0_10px_#c4b5fd]" />
              {formatDate(new Date())}
            </span>
            <button
              type="button"
              onClick={onRefresh}
              aria-label="Atualizar dashboard"
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] text-white/55 transition hover:bg-white/10 hover:text-white"
            >
              <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {lastUpdated ? `Atualizado às ${formatTime(lastUpdated)}` : 'Atualizar'}
            </button>
          </motion.div>

          <motion.h1
            {...reveal(0.08)}
            className="mt-5 font-display text-[34px] font-bold leading-[1.05] tracking-tight sm:text-[44px]"
          >
            {getGreeting()}, {userName}
          </motion.h1>
          <motion.p {...reveal(0.16)} className="mt-3 max-w-md text-[15px] leading-relaxed text-white/65">
            Aqui está o pulso das suas vendas: o que entrou, o que está em negociação e o que precisa de você hoje.
          </motion.p>

          <motion.div {...reveal(0.24)} className="mt-7 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={onNewDeal}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[#fff] px-5 text-[14px] font-semibold text-[#120c24] shadow-[0_10px_30px_-10px_rgba(255,255,255,0.45)] transition hover:bg-[#ede9fe] active:scale-[0.98]"
            >
              <Plus className="size-4" strokeWidth={2.4} />
              Novo negócio
            </button>
            <button
              type="button"
              onClick={onNewContact}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-white/20 bg-white/[0.08] px-5 text-[14px] font-medium text-white backdrop-blur-md transition hover:bg-white/15 active:scale-[0.98]"
            >
              <UserPlus className="size-4" />
              Novo contato
            </button>
          </motion.div>
        </div>

        <motion.div {...reveal(0.3)}>
          <RevenueGlass revenue={revenue} series={revenueSeries} loading={loading} />
        </motion.div>
      </div>
    </section>
  )
}
