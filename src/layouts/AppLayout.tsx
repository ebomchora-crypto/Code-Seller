import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { toast } from 'sonner'
import { Bell } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { SmoothScrollProvider } from '@/components/providers/SmoothScrollProvider'
import { useTheme } from '@/hooks/useTheme'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { EASE_PREMIUM } from '@/utils/animations'
import { getUpcomingReminders } from '@/services/supabase/tasks'
import { cn } from '@/lib/utils'
import { getAppSurface } from '@/layouts/appSurface'

interface AppLayoutProps {
  children?: ReactNode
}

// AppLayout é renderizado de novo a cada navegação (cada página o instancia),
// então guardamos essa flag fora do componente para checar lembretes só uma
// vez por carregamento do app, não a cada troca de rota.
let reminderCheckDone = false

function formatReminderTime(value: string): string {
  return new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// Sistema de lembretes — MVP visual apenas (toast ao carregar o app).
// TODO: implementar push notifications reais (Service Worker + Supabase Edge
// Function com cron job) para avisos que funcionem com o app fechado.
function useReminderCheck() {
  useEffect(() => {
    if (reminderCheckDone) return
    reminderCheckDone = true

    getUpcomingReminders()
      .then((tasks) => {
        for (const task of tasks) {
          if (!task.reminder_at) continue
          toast(task.title, {
            id: `reminder-${task.id}`,
            description: `Lembrete para ${formatReminderTime(task.reminder_at)}`,
            icon: <Bell className="h-4 w-4 text-purple-600" />,
            duration: Infinity,
          })
        }
      })
      .catch(() => {
        // Falha silenciosa: lembretes são um recurso auxiliar, não devem
        // travar o carregamento do app.
      })
  }, [])
}

export function AppLayout({ children }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { resolvedTheme, toggleTheme } = useTheme()
  const { pathname } = useLocation()
  const reducedMotion = useReducedMotion()
  const mainRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const content = children ?? <Outlet />
  const surface = getAppSurface(pathname)

  useReminderCheck()

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-secondary)] transition-colors duration-300">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((value) => !value)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header onOpenMobileMenu={() => setMobileOpen(true)} theme={resolvedTheme} onToggleTheme={toggleTheme} />
        <main
          ref={mainRef}
          className={cn(
            'relative flex-1 overflow-y-auto transition-colors duration-300',
            surface.dark && 'bg-accent-ink',
          )}
        >
          {/* Glow estático (sem animação JS) — só no dark mode, custo de render
              desprezível: uma única div com blur, nada por frame. */}
          <div
            className="pointer-events-none absolute -top-40 left-1/2 hidden h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-purple-600/[0.06] blur-[120px] dark:block"
            aria-hidden="true"
          />
          <SmoothScrollProvider wrapperRef={mainRef} contentRef={contentRef}>
            <div ref={contentRef} className="relative">
              {/* Cada página se auto-envolve em AppLayout (sem <Outlet/> compartilhado),
                  então uma troca de rota desmonta e remonta este componente — não há
                  como usar AnimatePresence com exit-animation sem mudar a estrutura de
                  rotas. Este fade+slide roda só na entrada (mount), por `pathname`. */}
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={pathname}
                  initial={reducedMotion || !surface.animateOpacity ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reducedMotion || !surface.animateOpacity ? undefined : { opacity: 0, y: -6 }}
                  transition={{ duration: reducedMotion || !surface.animateOpacity ? 0 : 0.3, ease: EASE_PREMIUM }}
                >
                  {content}
                </motion.div>
              </AnimatePresence>
            </div>
          </SmoothScrollProvider>
        </main>
      </div>
    </div>
  )
}
