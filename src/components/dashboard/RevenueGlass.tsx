import { useEffect, useRef, useState } from 'react'
import { CalendarRange } from 'lucide-react'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import { useRevenuePeriod } from '@/hooks/useRevenuePeriod'
import { formatRangeLabel, PERIOD_OPTIONS, toDateInput } from '@/utils/revenuePeriod'
import type { CustomRange, DashboardMetric, RevenueDataPoint, RevenuePeriod, RevenueSource } from '@/types'

interface RevenueGlassProps {
  /** Receita do mês já calculada pelo Dashboard — usada enquanto o card carrega. */
  revenue?: DashboardMetric
  /** Últimos meses de receita (linha do padrão "Mês · Vendido"). */
  monthlySeries: RevenueDataPoint[]
  loading?: boolean
}

interface StoredChoice {
  period: RevenuePeriod
  source: RevenueSource
  custom: CustomRange | null
}

const STORAGE_KEY = 'code-sellers-revenue-card'
const DEFAULT_CHOICE: StoredChoice = { period: 'month', source: 'sold', custom: null }

function readChoice(): StoredChoice {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_CHOICE
    const parsed = JSON.parse(raw) as StoredChoice
    if (parsed.period === 'custom' && !parsed.custom) return DEFAULT_CHOICE
    return { ...DEFAULT_CHOICE, ...parsed }
  } catch {
    return DEFAULT_CHOICE
  }
}

function saveChoice(choice: StoredChoice) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(choice))
  } catch {
    // Sem armazenamento: a escolha vale só nesta visita.
  }
}

const TITLES: Record<RevenueSource, Record<RevenuePeriod, string>> = {
  sold: { today: 'Vendido hoje', week: 'Vendido na semana', month: 'Receita do mês', custom: 'Vendido no período' },
  received: { today: 'Recebido hoje', week: 'Recebido na semana', month: 'Recebido no mês', custom: 'Recebido no período' },
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

const SPARK_WIDTH = 248
const SPARK_HEIGHT = 56

// Linha suave desenhada à mão (sem recharts) — é só um traço decorativo
// dentro do card de vidro.
function sparkPaths(values: number[]) {
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

// Card de vidro do topo do Início. O visual é o mesmo de sempre; por cima
// entram a escolha do período (Hoje, Semana, Mês ou um intervalo) e se o valor
// é o que foi vendido (negócios ganhos) ou o que entrou no caixa (Financeiro).
export function RevenueGlass({ revenue, monthlySeries, loading }: RevenueGlassProps) {
  const [choice, setChoice] = useState<StoredChoice>(readChoice)
  const [pickerOpen, setPickerOpen] = useState(false)
  const today = toDateInput(new Date())
  const [draft, setDraft] = useState<CustomRange>(() => {
    if (choice.custom) return choice.custom
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 6)
    return { from: toDateInput(weekAgo), to: toDateInput(new Date()) }
  })
  const pickerRef = useRef<HTMLDivElement>(null)

  const { summary, range, loading: periodLoading } = useRevenuePeriod({
    period: choice.period,
    custom: choice.custom,
    source: choice.source,
  })

  useEffect(() => saveChoice(choice), [choice])

  useEffect(() => {
    if (!pickerOpen) return
    function onPointerDown(event: PointerEvent) {
      if (!pickerRef.current?.contains(event.target as Node)) setPickerOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [pickerOpen])

  const isDefault = choice.period === 'month' && choice.source === 'sold'
  const useMonthly = isDefault && monthlySeries.some((point) => point.value > 0)
  const values = useMonthly ? monthlySeries.map((point) => point.value) : (summary?.series ?? []).map((point) => point.value)
  const hasSeries = values.some((value) => value > 0)
  const spark = hasSeries ? sparkPaths(values) : null

  const total = summary?.total ?? (isDefault ? revenue?.raw_value : undefined)
  const change = summary?.change ?? (isDefault ? revenue?.change : undefined)
  const showSkeleton = (loading && isDefault && !summary) || (periodLoading && !summary)

  function selectPeriod(period: RevenuePeriod) {
    if (period === 'custom') {
      setPickerOpen((open) => !open)
      return
    }
    setPickerOpen(false)
    setChoice((current) => ({ ...current, period }))
  }

  function applyCustom() {
    if (!draft.from || !draft.to) return
    setChoice((current) => ({ ...current, period: 'custom', custom: draft }))
    setPickerOpen(false)
  }

  const caption = useMonthly
    ? `${change?.label ?? 'Negócios ganhos neste mês'} · últimos ${monthlySeries.length} meses`
    : `${change?.label ?? ''}${change ? ' · ' : ''}${formatRangeLabel(range)}`

  return (
    <div className="relative w-full rounded-[22px] border border-white/15 bg-white/[0.08] p-5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:w-[312px]">
      <div ref={pickerRef}>
        <div role="group" aria-label="Período da receita" className="flex rounded-full bg-black/25 p-0.5">
          {PERIOD_OPTIONS.map((option) => {
            const active = choice.period === option.value
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                aria-expanded={option.value === 'custom' ? pickerOpen : undefined}
                onClick={() => selectPeriod(option.value)}
                className={`flex h-7 flex-1 items-center justify-center gap-1 rounded-full text-[11.5px] font-medium transition-colors ${
                  active ? 'bg-white/[0.16] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]' : 'text-white/55 hover:text-white'
                }`}
              >
                {option.value === 'custom' && <CalendarRange className="size-3" />}
                {option.label}
              </button>
            )
          })}
        </div>

        {pickerOpen && (
          <div className="absolute inset-x-3 top-12 z-20 rounded-2xl border border-white/15 bg-[#1a1230]/95 p-4 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl [color-scheme:dark]">
            <p className="text-[12.5px] font-medium text-white/80">Escolha o período</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 text-[11px] text-white/55">
                De
                <input
                  type="date"
                  value={draft.from}
                  max={today}
                  onChange={(event) => setDraft((current) => ({ ...current, from: event.target.value }))}
                  className="h-9 rounded-xl border border-white/15 bg-white/[0.06] px-2 text-[12.5px] text-white outline-none focus:border-[#a78bfa]"
                />
              </label>
              <label className="flex flex-col gap-1 text-[11px] text-white/55">
                Até
                <input
                  type="date"
                  value={draft.to}
                  max={today}
                  onChange={(event) => setDraft((current) => ({ ...current, to: event.target.value }))}
                  className="h-9 rounded-xl border border-white/15 bg-white/[0.06] px-2 text-[12.5px] text-white outline-none focus:border-[#a78bfa]"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={applyCustom}
              disabled={!draft.from || !draft.to}
              className="mt-3 h-9 w-full rounded-xl bg-[#fff] text-[13px] font-semibold text-[#120c24] transition hover:bg-[#ede9fe] disabled:opacity-50"
            >
              Aplicar
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-[13px] font-medium text-white/70">{TITLES[choice.source][choice.period]}</p>
        <div role="group" aria-label="Origem do valor" className="flex shrink-0 rounded-full bg-black/25 p-0.5">
          {(
            [
              { value: 'sold', label: 'Vendido' },
              { value: 'received', label: 'Recebido' },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={choice.source === option.value}
              onClick={() => setChoice((current) => ({ ...current, source: option.value }))}
              title={option.value === 'sold' ? 'Negócios ganhos' : 'Entradas pagas no Financeiro'}
              className={`h-6 rounded-full px-2.5 text-[11px] font-medium transition-colors ${
                choice.source === option.value ? 'bg-white/[0.16] text-white' : 'text-white/50 hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2 flex items-end justify-between gap-3">
        {showSkeleton || total === undefined ? (
          <div className="mt-1 h-9 w-40 animate-pulse rounded-lg bg-white/10" />
        ) : (
          <p className="font-display text-[34px] font-bold leading-none tracking-tight">
            <AnimatedCounter key={`${choice.period}-${choice.source}-${choice.custom?.from}`} value={total} duration={900} format={formatBRL} />
          </p>
        )}
        {change && change.direction !== 'neutral' && (
          <span
            className={`mb-1 shrink-0 rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${
              change.direction === 'up' ? 'bg-emerald-400/15 text-emerald-300' : 'bg-red-400/15 text-red-300'
            }`}
          >
            {change.direction === 'up' ? '↑' : '↓'} {change.value}%
          </span>
        )}
      </div>

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

      <p className="mt-2 text-[12px] text-white/55">{caption}</p>
    </div>
  )
}
