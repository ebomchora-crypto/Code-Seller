import { Link } from 'react-router-dom'
import { MonitorPlay, Plus, RefreshCw, UserPlus } from 'lucide-react'
import { motion } from 'motion/react'
import { SilkRibbons } from '@/components/auth/SilkRibbons'
import { RevenueGlass } from '@/components/dashboard/RevenueGlass'
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

// Topo do Dashboard: fundo escuro com brilho roxo suave (as fitas das telas de
// acesso aparecem só no canto), a saudação, as ações rápidas e a receita.
export function WelcomeBanner({ userName, lastUpdated, onRefresh, refreshing, loading, revenue, revenueSeries, onNewContact, onNewDeal }: WelcomeBannerProps) {
  const reducedMotion = useReducedMotion()
  const reveal = (delay: number) => ({
    initial: reducedMotion ? false : { opacity: 0, y: 18, filter: 'blur(6px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    transition: { duration: 0.8, ease: EASE_PREMIUM, delay },
  })

  return (
    <section className="relative isolate overflow-hidden rounded-[24px] bg-[#0d0918] text-white ring-1 ring-white/[0.06]">
      {/* Fundo calmo: brilhos suaves e as fitas só no canto direito, bem apagadas. */}
      <div className="absolute -right-24 -top-32 size-[420px] rounded-full bg-[#7c3aed]/30 blur-[110px]" aria-hidden />
      <div className="absolute -bottom-40 left-1/4 size-[360px] rounded-full bg-[#4c1d95]/25 blur-[120px]" aria-hidden />
      <div
        className="absolute inset-y-0 right-0 hidden w-[58%] opacity-60 md:block"
        style={{
          maskImage: 'radial-gradient(120% 90% at 100% 0%, #000 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(120% 90% at 100% 0%, #000 30%, transparent 75%)',
        }}
        aria-hidden
      >
        <SilkRibbons className="h-full w-full animate-silk-drift" />
      </div>
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(196,181,253,0.35),transparent)]" aria-hidden />

      <div className="relative flex flex-col gap-8 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
        <div className="min-w-0 max-w-xl">
          <motion.div {...reveal(0)} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-white/55">
            <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" aria-hidden />
            <span>{formatDate(new Date())}</span>
            <span className="hidden text-white/25 sm:inline" aria-hidden>
              ·
            </span>
            <button
              type="button"
              onClick={onRefresh}
              aria-label="Atualizar dashboard"
              className="inline-flex items-center gap-1.5 rounded-full transition hover:text-white"
            >
              <RefreshCw className={`size-3 ${refreshing ? 'animate-spin' : ''}`} />
              {lastUpdated ? `Atualizado às ${formatTime(lastUpdated)}` : 'Atualizar'}
            </button>
          </motion.div>

          <motion.h1
            {...reveal(0.08)}
            className="mt-4 font-display text-[32px] font-bold leading-[1.08] tracking-tight [overflow-wrap:anywhere] sm:text-[40px]"
          >
            {getGreeting()}, <span className="bg-[linear-gradient(100deg,#ffffff,#d8ccff_60%,#b79cff)] bg-clip-text text-transparent">{userName}</span>
          </motion.h1>
          <motion.p {...reveal(0.16)} className="mt-2.5 max-w-md text-[14.5px] leading-relaxed text-white/60">
            O que entrou, o que está em negociação e o que precisa de você hoje.
          </motion.p>

          <motion.div {...reveal(0.24)} className="mt-6 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onNewDeal}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-[#fff] px-[18px] text-[13.5px] font-semibold text-[#120c24] shadow-[0_10px_30px_-12px_rgba(255,255,255,0.5)] transition hover:bg-[#ede9fe] active:scale-[0.98]"
            >
              <Plus className="size-4" strokeWidth={2.4} />
              Novo negócio
            </button>
            <button
              type="button"
              onClick={onNewContact}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-[18px] text-[13.5px] font-medium text-white transition hover:bg-white/[0.12] active:scale-[0.98]"
            >
              <UserPlus className="size-4" />
              Novo contato
            </button>
            <Link
              to="/sala-de-receita"
              className="inline-flex h-10 items-center gap-2 rounded-full px-3.5 text-[13.5px] font-medium text-white/65 transition hover:bg-white/[0.08] hover:text-white active:scale-[0.98]"
            >
              <MonitorPlay className="size-4" />
              Sala de receita
            </Link>
          </motion.div>
        </div>

        <motion.div {...reveal(0.3)} className="lg:shrink-0">
          <RevenueGlass revenue={revenue} monthlySeries={revenueSeries} loading={loading} />
        </motion.div>
      </div>
    </section>
  )
}
