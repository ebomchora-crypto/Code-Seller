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
            <Link
              to="/sala-de-receita"
              className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-[14px] font-medium text-white/75 transition hover:bg-white/10 hover:text-white active:scale-[0.98]"
            >
              <MonitorPlay className="size-4" />
              Sala de receita
            </Link>
          </motion.div>
        </div>

        <motion.div {...reveal(0.3)}>
          <RevenueGlass revenue={revenue} monthlySeries={revenueSeries} loading={loading} />
        </motion.div>
      </div>
    </section>
  )
}
