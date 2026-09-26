import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { animate, AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, Maximize2, Minimize2 } from 'lucide-react'
import { SilkRibbons } from '@/components/auth/SilkRibbons'
import { RoomChart, type RoomChartPoint } from '@/components/revenue-room/RoomChart'
import { useRevenuePeriod } from '@/hooks/useRevenuePeriod'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { getPeriodProfit } from '@/services/supabase/revenue'
import { useAuthContext } from '@/stores/AuthContext'
import type { RevenueEntry, RevenuePeriod, RevenueSource } from '@/types'

type RoomPeriod = Exclude<RevenuePeriod, 'custom'>

interface RoomChoice {
  period: RoomPeriod
  source: RevenueSource
}

const STORAGE_KEY = 'code-sellers-revenue-room'
const POLL_MS = 20_000

const PERIODS: { value: RoomPeriod; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
]

const TITLES: Record<RevenueSource, Record<RoomPeriod, string>> = {
  sold: { today: 'Vendas hoje', week: 'Vendas da semana', month: 'Vendas do mês' },
  received: { today: 'Recebido hoje', week: 'Recebido na semana', month: 'Recebido no mês' },
}

const SERIES_LABELS: Record<RoomPeriod, [string, string]> = {
  today: ['Hoje', 'Ontem'],
  week: ['Esta semana', 'Semana passada'],
  month: ['Este mês', 'Mês passado'],
}

function readChoice(): RoomChoice {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { period: 'today', source: 'sold', ...(JSON.parse(raw) as Partial<RoomChoice>) }
  } catch {
    // Sem armazenamento: começa em "Hoje · Vendido".
  }
  return { period: 'today', source: 'sold' }
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// Número que conta do valor anterior até o novo (não volta a zero a cada
// atualização automática).
function useRollingNumber(target: number, reducedMotion: boolean) {
  const [display, setDisplay] = useState(0)
  const current = useRef(0)

  useEffect(() => {
    if (reducedMotion) {
      current.current = target
      return
    }
    const controls = animate(current.current, target, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (value) => {
        current.current = value
        setDisplay(value)
      },
    })
    return () => controls.stop()
  }, [target, reducedMotion])

  return reducedMotion ? target : display
}

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  return now
}

function Bracket({ className }: { className: string }) {
  return <span aria-hidden className={`absolute size-4 border-[#c4b5fd]/70 ${className}`} />
}

function StatPanel({ kicker, value, hint }: { kicker: string; value: string; hint: string }) {
  return (
    <div className="relative flex flex-col items-center justify-center px-4 py-5 text-center">
      <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.2em] text-white/45">{kicker}</p>
      <p className="mt-2 font-display text-[26px] font-bold tabular-nums tracking-tight text-white sm:text-[30px]">{value}</p>
      <p className="mt-1 text-[12px] text-white/45">{hint}</p>
    </div>
  )
}

// Sala de receita: tela cheia, sempre escura, feita para deixar aberta num
// monitor ou notebook e acompanhar as vendas entrando ao vivo.
export default function RevenueRoomPage() {
  const { user, profile } = useAuthContext()
  const reducedMotion = useReducedMotion()
  const now = useClock()
  const [choice, setChoice] = useState<RoomChoice>(readChoice)
  const [fullscreen, setFullscreen] = useState(false)
  const [celebration, setCelebration] = useState<RevenueEntry | null>(null)
  const [profit, setProfit] = useState<{ received: number; expenses: number } | null>(null)

  const handleNewEntries = useCallback((entries: RevenueEntry[]) => {
    const biggest = [...entries].sort((a, b) => b.amount - a.amount)[0]
    if (biggest) setCelebration(biggest)
  }, [])

  const { summary, range, loading, lastUpdated } = useRevenuePeriod({
    period: choice.period,
    custom: null,
    source: choice.source,
    pollMs: POLL_MS,
    onNewEntries: handleNewEntries,
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(choice))
    } catch {
      // Ignora: preferência só desta visita.
    }
  }, [choice])

  useEffect(() => {
    if (!celebration) return
    const timer = window.setTimeout(() => setCelebration(null), 5000)
    return () => window.clearTimeout(timer)
  }, [celebration])

  useEffect(() => {
    let cancelled = false
    getPeriodProfit(range)
      .then((next) => !cancelled && setProfit(next))
      .catch(() => !cancelled && setProfit(null))
    return () => {
      cancelled = true
    }
  }, [range, lastUpdated])

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  function toggleFullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void document.documentElement.requestFullscreen?.().catch(() => undefined)
  }

  const total = useRollingNumber(summary?.total ?? 0, reducedMotion)
  const ownerName = (profile?.full_name || user?.name || user?.email || '').split(' ')[0]

  const chartSeries = useMemo<RoomChartPoint[]>(() => {
    if (!summary) return []
    const nowTime = now.getTime()
    const step = range.granularity === 'hour' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000
    return summary.series.map((point, index) => ({
      ...point,
      value: range.start.getTime() + index * step > nowTime ? null : point.value,
    }))
    // O relógio muda a cada segundo; a série só precisa andar a cada minuto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary, range, Math.floor(now.getTime() / 60000)])

  const count = summary?.count ?? 0
  const ticket = count > 0 ? (summary?.total ?? 0) / count : 0
  const profitValue = profit ? profit.received - profit.expenses : null
  const margin = profit && profit.received > 0 ? Math.round(((profit.received - profit.expenses) / profit.received) * 100) : null
  const change = summary?.change
  const [currentLabel, previousLabel] = SERIES_LABELS[choice.period]

  const controls = (
    <>
          <div role="group" aria-label="Período" className="flex rounded-full border border-white/10 bg-black/35 p-1 backdrop-blur">
            {PERIODS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={choice.period === option.value}
                onClick={() => setChoice((current) => ({ ...current, period: option.value }))}
                className={`h-8 rounded-full px-4 text-[12.5px] font-medium transition-colors ${
                  choice.period === option.value ? 'bg-[#8b5cf6]/35 text-white' : 'text-white/55 hover:text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div role="group" aria-label="Origem" className="flex rounded-full border border-white/10 bg-black/35 p-1 backdrop-blur">
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
                className={`h-8 rounded-full px-4 text-[12.5px] font-medium transition-colors ${
                  choice.source === option.value ? 'bg-[#8b5cf6]/35 text-white' : 'text-white/55 hover:text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
            </>
  )

  const dateLine = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const timeLine = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07050d] text-white [color-scheme:dark]">
      {/* Faixa superior com o tecido roxo e feixes de luz */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[430px] overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#2a1452_0%,#170b30_55%,#07050d_100%)]" />
        <div
          className="absolute inset-0 opacity-70"
          style={{ maskImage: 'linear-gradient(180deg, #000 30%, transparent)', WebkitMaskImage: 'linear-gradient(180deg, #000 30%, transparent)' }}
        >
          <SilkRibbons className="h-full w-full animate-silk-drift" />
        </div>
        <div className="absolute -left-40 top-10 h-[2px] w-[70%] rotate-[-8deg] bg-[linear-gradient(90deg,transparent,#c4b5fd,transparent)] opacity-40 blur-[1px]" />
        <div className="absolute -right-40 top-24 h-[2px] w-[60%] rotate-[10deg] bg-[linear-gradient(90deg,transparent,#a78bfa,transparent)] opacity-30 blur-[1px]" />
      </div>
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-[300px] size-[620px] -translate-x-1/2 rounded-full bg-[#7c3aed]/20 blur-[140px]" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 opacity-[0.07]"
        style={{
          backgroundImage: 'repeating-radial-gradient(ellipse at 20% 120%, transparent 0 22px, #c4b5fd 23px 24px)',
        }}
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1280px] flex-col px-4 pb-8 pt-5 sm:px-8">
        {/* Barra superior */}
        <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <Link
            to="/"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3.5 py-2 text-[12.5px] font-medium text-white/80 backdrop-blur transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Voltar ao início</span>
          </Link>

          <div className="relative flex items-center gap-2.5 border border-[#a78bfa]/40 bg-black/40 px-5 py-2.5 backdrop-blur [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_50%,calc(100%-10px)_100%,10px_100%,0_50%)]">
            <img src="/logo.png" alt="" className="size-5 object-contain" />
            <span className="font-mono text-[12px] font-bold uppercase tracking-[0.28em] text-white">Code Sellers</span>
          </div>

          <div className="flex items-center justify-end gap-2">
            <div className="hidden items-center gap-2 lg:flex">{controls}</div>
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={fullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
              title={fullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
              className="flex size-9 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white/75 backdrop-blur transition hover:bg-white/10 hover:text-white"
            >
              {fullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </button>
          </div>
        </header>

        {/* Título */}
        <div className="mt-4 text-center">
          <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.3em] text-[#c4b5fd]/80">
            Sala de receita{ownerName ? ` · ${ownerName}` : ''}
          </p>
          <h1 className="mt-2 font-display text-[30px] font-bold tracking-tight sm:text-[38px]">{TITLES[choice.source][choice.period]}</h1>
          <div className="mt-2 flex items-center justify-center gap-3 font-mono text-[11px] tracking-[0.14em] text-white/50">
            <span className="h-px w-8 bg-white/20" />
            <span className="tabular-nums">{dateLine}</span>
            <span className="text-[#c4b5fd]">•</span>
            <span className="tabular-nums">{timeLine}</span>
            <span className="h-px w-8 bg-white/20" />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 lg:hidden">{controls}</div>

        {/* Número principal */}
        <div className="relative mx-auto mt-5 w-full max-w-[560px]">
          <div className="relative border border-[#a78bfa]/35 bg-[linear-gradient(180deg,rgba(26,16,48,0.85),rgba(10,7,20,0.9))] px-6 pb-5 pt-4 shadow-[0_0_60px_-10px_rgba(139,92,246,0.45),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
            <Bracket className="-left-px -top-px border-l-2 border-t-2" />
            <Bracket className="-right-px -top-px border-r-2 border-t-2" />
            <Bracket className="-bottom-px -left-px border-b-2 border-l-2" />
            <Bracket className="-bottom-px -right-px border-b-2 border-r-2" />

            <div className="flex items-center justify-between font-mono text-[10px] font-semibold uppercase tracking-[0.2em]">
              <span className="text-white/50">{choice.source === 'sold' ? 'Faturamento confirmado' : 'Entradas confirmadas'}</span>
              <span className="flex items-center gap-1.5 text-[#c4b5fd]">
                <span className="size-1.5 animate-pulse rounded-full bg-[#c4b5fd] shadow-[0_0_8px_#c4b5fd]" />
                Ao vivo
              </span>
            </div>

            <p className="mt-3 flex items-baseline justify-center gap-2 font-display font-bold tabular-nums tracking-tight">
              <span className="text-[22px] text-[#c4b5fd] sm:text-[28px]">R$</span>
              {loading && !summary ? (
                <span className="inline-block h-14 w-60 animate-pulse rounded-xl bg-white/10" />
              ) : (
                <span className="text-[48px] leading-none text-white [text-shadow:0_0_30px_rgba(167,139,250,0.45)] sm:text-[68px]">
                  {formatBRL(total)}
                </span>
              )}
            </p>

            <div className="mt-3 flex items-center justify-center gap-3 text-[11.5px]">
              <span className="flex items-center gap-1.5 text-white/50">
                <span className="relative flex size-2">
                  <span className="absolute inset-0 animate-ping rounded-full bg-[#a78bfa]/60" />
                  <span className="relative size-2 rounded-full bg-[#a78bfa]" />
                </span>
                Atualização automática
              </span>
              {change && change.direction !== 'neutral' && (
                <span className={change.direction === 'up' ? 'font-semibold text-emerald-300' : 'font-semibold text-red-300'}>
                  {change.direction === 'up' ? '+' : '−'}
                  {change.value.toLocaleString('pt-BR')}% {change.label}
                </span>
              )}
            </div>
          </div>
          <div aria-hidden className="mx-auto h-1 w-3/4 rounded-b-full bg-[linear-gradient(90deg,transparent,#a78bfa,transparent)] shadow-[0_0_24px_#8b5cf6]" />
        </div>

        {/* Gráfico */}
        <section className="mt-6 grid flex-1 gap-5 rounded-[24px] border border-white/10 bg-black/35 p-5 backdrop-blur-xl sm:p-6 lg:grid-cols-[1fr_240px]">
          <div className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c4b5fd]/80">
                Desempenho {range.granularity === 'hour' ? 'por horário' : 'por dia'}
              </p>
              <h2 className="mt-1 font-display text-[20px] font-semibold tracking-tight">Tendência de vendas</h2>
              <p className="text-[12.5px] text-white/45">
                {choice.source === 'sold' ? 'Negócios ganhos' : 'Entradas recebidas'}{' '}
                {range.granularity === 'hour' ? 'ao longo do dia' : 'ao longo do período'}
              </p>
            </div>
            <div className="flex items-center gap-4 text-[12px] text-white/55">
              <span className="flex items-center gap-2">
                <span className="h-0.5 w-5 rounded bg-[#c4b5fd] shadow-[0_0_8px_#a78bfa]" />
                {currentLabel}
              </span>
              <span className="flex items-center gap-2">
                <span className="h-0 w-5 border-t border-dashed border-white/40" />
                {previousLabel}
              </span>
            </div>
          </div>
          <div className="mt-4 h-[240px] sm:h-[280px] lg:h-[clamp(200px,calc(100vh-575px),380px)]">
            {summary && <RoomChart series={chartSeries} currentLabel={currentLabel} previousLabel={previousLabel} animate={!reducedMotion} />}
          </div>

          </div>

          <div className="grid grid-cols-1 divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[0.02] sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:grid-cols-1 lg:divide-x-0 lg:divide-y">
            <StatPanel
              kicker={choice.source === 'sold' ? 'Vendas confirmadas' : 'Recebimentos'}
              value={String(count).padStart(2, '0')}
              hint={choice.period === 'today' ? 'hoje' : choice.period === 'week' ? 'nesta semana' : 'neste mês'}
            />
            <StatPanel kicker="Ticket médio" value={count > 0 ? formatCurrency(ticket) : '—'} hint={choice.source === 'sold' ? 'por venda' : 'por recebimento'} />
            <StatPanel
              kicker="Lucro do período"
              value={profitValue === null ? '—' : formatCurrency(profitValue)}
              hint={margin === null ? 'entradas − despesas pagas' : `${margin}% de margem`}
            />
          </div>
        </section>

        <p className="mt-4 text-center text-[11.5px] text-white/40">
          <span className="text-[#c4b5fd]">●</span> A sala acompanha sozinha as novas{' '}
          {choice.source === 'sold' ? 'vendas registradas' : 'entradas recebidas'}
          {ownerName ? ` por ${ownerName}` : ''}
          {lastUpdated ? ` · atualizado às ${lastUpdated.toLocaleTimeString('pt-BR')}` : ''}
        </p>
      </div>

      {/* Venda nova entrando */}
      <AnimatePresence>
        {celebration && (
          <motion.div
            key={celebration.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-[#07050d]/40 backdrop-blur-[2px]"
            role="status"
            aria-live="polite"
          >
            <motion.div
              initial={reducedMotion ? false : { scale: 0.6, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 1.08, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              className="text-center"
            >
              <p className="rounded-2xl bg-black/80 px-8 py-4 font-display text-[56px] font-bold tabular-nums text-white shadow-[0_0_80px_rgba(139,92,246,0.6)] sm:text-[80px]">
                + {formatCurrency(celebration.amount).replace(',00', '')}
              </p>
              <p className="mt-4 text-[16px] font-medium text-white/85">{celebration.title}</p>
              {celebration.subtitle && <p className="text-[13px] text-white/50">{celebration.subtitle}</p>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
