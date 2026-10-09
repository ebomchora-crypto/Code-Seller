import { useEffect, useRef, useState, type ReactNode } from 'react'
import { BillingBanner } from '@/components/billing/BillingBanner'
import { useLocation, useOutlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { toast } from 'sonner'
import { Bell } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { CommandPalette } from '@/components/layout/CommandPalette'
import { SmoothScrollProvider } from '@/components/providers/SmoothScrollProvider'
import { useTheme } from '@/hooks/useTheme'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { duration, easing } from '@/motion/tokens'
import { getUpcomingReminders, markRemindersSeen } from '@/services/supabase/tasks'
import { cn } from '@/lib/utils'
import { getAppSurface } from '@/layouts/appSurface'
import { scrollAppToTop } from '@/utils/appScroll'
import { useViewCurrency } from '@/hooks/useViewCurrency'
import { isDesktopApp } from '@/utils/desktop'
import { startDownload, takeDownloadIntent } from '@/utils/downloadIntent'

interface AppLayoutProps {
  children?: ReactNode
}

// AppLayout monta uma única vez no nível do router (envolvendo <Outlet/>,
// ver src/router/index.tsx) e persiste entre navegações — só o conteúdo da
// rota troca. Por isso a flag abaixo, fora do componente, ainda garante que
// os lembretes só sejam checados uma vez por carregamento do app.
let reminderCheckDone = false

// Congela o conteúdo da rota em que a página nasceu. Sem isto, durante a
// animação de saída o <Outlet/> da página que está saindo já mostraria a rota
// NOVA — ela montava duas vezes e perdia o estado (ex.: ?novo=1 e ?importar=1
// abriam a janela e ela fechava sozinha).
function FrozenRoute({ children }: { children?: ReactNode }) {
  const outlet = useOutlet()
  const [frozenOutlet] = useState(outlet)
  return <>{children ?? frozenOutlet}</>
}

function formatReminderTime(value: string): string {
  return new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// Veio do "Baixar app" da landing: depois de criar a conta e entrar, o
// download começa sozinho (com botão de reserva se o navegador segurar).
function useDownloadAfterSignup() {
  useEffect(() => {
    if (isDesktopApp()) return
    const intent = takeDownloadIntent()
    if (!intent) return
    startDownload(intent)
    toast.success(intent === 'ide' ? 'Conta pronta! O download da IDE para Windows começou.' : 'Conta pronta! O download do app para Windows começou.', {
      description: 'Se não começar, clique em Baixar.',
      action: { label: 'Baixar', onClick: () => startDownload(intent) },
      duration: 20000,
    })
  }, [])
}

// Aviso na tela dos lembretes que chegaram (ou chegam na próxima hora) ao
// abrir o app. Com o app fechado, quem avisa é a notificação no celular.
function useReminderCheck() {
  useEffect(() => {
    if (reminderCheckDone) return
    reminderCheckDone = true

    getUpcomingReminders()
      .then((tasks) => {
        const shown: string[] = []
        for (const task of tasks) {
          if (!task.reminder_at) continue
          toast(task.title, {
            id: `reminder-${task.id}`,
            description: `Lembrete para ${formatReminderTime(task.reminder_at)}`,
            icon: <Bell className="h-4 w-4 text-purple-600" />,
            duration: Infinity,
          })
          shown.push(task.id)
        }
        // Cada lembrete aparece uma vez só (mudar o horário libera de novo).
        return markRemindersSeen(shown)
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
  const surface = getAppSurface(pathname)
  // Trocar a moeda dos totais recarrega a página atual com os números dessa moeda.
  const [viewCurrency] = useViewCurrency()

  useReminderCheck()
  useDownloadAfterSignup()

  // Cada página nova começa do topo (o scroll fica no <main>, não na window).
  useEffect(() => {
    scrollAppToTop()
  }, [pathname])

  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--shell-bg)] transition-colors duration-300">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((value) => !value)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Painel de conteúdo: um cartão grande e arredondado "apoiado" na casca,
          com o menu do lado de fora — no mobile ocupa a tela toda. */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[var(--panel-bg)] transition-colors duration-300 lg:my-2.5 lg:mr-2.5 lg:rounded-[26px] lg:border lg:border-[var(--panel-border)] lg:shadow-[0_30px_80px_-40px_rgba(0,0,0,0.55)]">
        <BillingBanner />
        <Header onOpenMobileMenu={() => setMobileOpen(true)} theme={resolvedTheme} onToggleTheme={toggleTheme} />
        <main
          ref={mainRef}
          className={cn(
            'relative flex-1 transition-colors duration-300',
            surface.immersive ? 'overflow-hidden' : 'overflow-y-auto overflow-x-hidden',
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
                  key={`${pathname}|${viewCurrency}`}
                  className={surface.immersive ? 'h-full' : undefined}
                  initial={reducedMotion || !surface.animateOpacity ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reducedMotion || !surface.animateOpacity ? undefined : { opacity: 0, y: -6 }}
                  transition={{ duration: reducedMotion || !surface.animateOpacity ? 0 : duration.page, ease: easing.standard }}
                >
                  <FrozenRoute>{children}</FrozenRoute>
                </motion.div>
              </AnimatePresence>
            </div>
          </SmoothScrollProvider>
        </main>
      </div>
      <CommandPalette />
    </div>
  )
}
