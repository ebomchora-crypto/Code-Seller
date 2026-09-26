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
import { duration, easing } from '@/motion/tokens'
import { getUpcomingReminders } from '@/services/supabase/tasks'
import { cn } from '@/lib/utils'
import { getAppSurface } from '@/layouts/appSurface'

interface AppLayoutProps {
  children?: ReactNode
}

// AppLayout monta uma única vez no nível do router (envolvendo <Outlet/>,
// ver src/router/index.tsx) e persiste entre navegações — só o conteúdo da
// rota troca. Por isso a flag abaixo, fora do componente, ainda garante que
// os lembretes só sejam checados uma vez por carregamento do app.
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
    <div className="flex h-screen overflow-hidden bg-[var(--shell-bg)] transition-colors duration-300">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((value) => !value)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Painel de conteúdo: um cartão grande e arredondado "apoiado" na casca,
          com o menu do lado de fora — no mobile ocupa a tela toda. */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[var(--panel-bg)] transition-colors duration-300 lg:my-2.5 lg:mr-2.5 lg:rounded-[26px] lg:border lg:border-[var(--panel-border)] lg:shadow-[0_30px_80px_-40px_rgba(0,0,0,0.55)]">
        <Header onOpenMobileMenu={() => setMobileOpen(true)} theme={resolvedTheme} onToggleTheme={toggleTheme} />
        <main
          ref={mainRef}
          className={cn(
            'relative flex-1 transition-colors duration-300',
            surface.immersive ? 'overflow-hidden' : 'overflow-y-auto',
          )}
        >
          {/* Brilho roxo estático no topo do painel — só no dark mode. */}
          <div
            className="pointer-events-none absolute -top-48 left-1/3 hidden h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-[#7c3aed]/[0.07] blur-[120px] dark:block"
            aria-hidden="true"
          />
          <SmoothScrollProvider wrapperRef={mainRef} contentRef={contentRef}>
            <div ref={contentRef} className={cn('relative', surface.immersive && 'h-full')}>
              {/* Page transition real: AppLayout persiste entre rotas (ver comentário
                  acima), então o exit abaixo realmente roda antes do próximo `key`
                  entrar — fade + translateY mínimo, rápido o bastante para não atrasar
                  a interação com a página nova. */}
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={pathname}
                  className={surface.immersive ? 'h-full' : undefined}
                  initial={reducedMotion || !surface.animateOpacity ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reducedMotion || !surface.animateOpacity ? undefined : { opacity: 0, y: -6 }}
                  transition={{ duration: reducedMotion || !surface.animateOpacity ? 0 : duration.page, ease: easing.standard }}
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
