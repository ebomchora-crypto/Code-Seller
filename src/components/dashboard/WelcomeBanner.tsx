import { RefreshCw } from 'lucide-react'
import { motion } from 'motion/react'
import { Skeleton } from '@/components/ui/Skeleton'
import { EASE_PREMIUM } from '@/utils/animations'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface WelcomeBannerProps {
  userName: string
  lastUpdated: Date | null
  onRefresh: () => void
  refreshing: boolean
  loading?: boolean
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function formatDate(date: Date): string {
  const formatted = date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function WelcomeBanner({ userName, lastUpdated, onRefresh, refreshing, loading }: WelcomeBannerProps) {
  const reducedMotion = useReducedMotion()
  if (loading) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <motion.h1
          initial={reducedMotion ? false : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE_PREMIUM }}
          className="font-display text-3xl font-bold tracking-tight text-[var(--text-primary)]"
        >
          {getGreeting()}, {userName}
        </motion.h1>
        <motion.p
          initial={reducedMotion ? false : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE_PREMIUM, delay: 0.1 }}
          className="mt-1 text-sm text-[var(--text-muted)]"
        >
          {formatDate(new Date())}
        </motion.p>
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.5, ease: EASE_PREMIUM, delay: 0.2 }}
          style={{ transformOrigin: 'left' }}
          className="mt-3 h-0.5 w-10 rounded-full bg-accent"
        />
      </div>

      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
        {lastUpdated && <span>Atualizado às {formatTime(lastUpdated)}</span>}
        <button
          type="button"
          onClick={onRefresh}
          aria-label="Atualizar dashboard"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  )
}
