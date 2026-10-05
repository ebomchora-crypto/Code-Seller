import { Suspense, useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation, useOutletContext, useParams } from 'react-router-dom'
import { SitesSidebar } from '@/components/code-maker/SitesSidebar'
import { Spinner } from '@/components/ui/Spinner'
import { listSiteItems, type SiteListItem } from '@/services/supabase/codeMaker'

export interface CodeMakerShellContext {
  /** Recarrega a lista de sites da barra lateral (site novo, renomeado, pronto…). */
  refreshSites: () => void
  /** Abre a lista de sites no celular. */
  openSites: () => void
}

const COLLAPSED_KEY = 'cs-code-maker:sidebar-collapsed'

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(COLLAPSED_KEY) === 'true'
  } catch {
    return false
  }
}

export function useCodeMakerShell(): CodeMakerShellContext {
  return useOutletContext<CodeMakerShellContext>()
}

// O Code Maker abre em tela cheia, fora do painel do sistema, como o CS
// Copilot: sites à esquerda; à direita, o pedido de um site novo ou o editor.
export default function CodeMakerShell() {
  const { id = null } = useParams()
  const location = useLocation()
  const [sites, setSites] = useState<SiteListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(readCollapsed)

  const refreshSites = useCallback(() => {
    listSiteItems()
      .then(setSites)
      .catch(() => undefined)
      .finally(() => setLoading(false))
  }, [])

  // Cada troca de tela (site novo, site apagado, outro site) atualiza a lista.
  useEffect(() => {
    refreshSites()
  }, [refreshSites, location.pathname])

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current
      try {
        window.localStorage.setItem(COLLAPSED_KEY, String(next))
      } catch {
        // Sem armazenamento: vale só nesta visita.
      }
      return next
    })
  }

  const context: CodeMakerShellContext = { refreshSites, openSites: () => setMobileOpen(true) }

  return (
    <div className="flex h-dvh min-h-0 overflow-hidden bg-[var(--panel-bg)] text-[var(--text-primary)]">
      <div
        className={`absolute inset-y-0 left-0 z-40 w-[270px] bg-[var(--bg-card)] transition-[width,transform] duration-200 lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'lg:w-16' : 'lg:w-[270px]'}`}
      >
        <SitesSidebar
          sites={sites}
          activeId={id}
          loading={loading}
          collapsed={collapsed && !mobileOpen}
          onToggleCollapsed={toggleCollapsed}
          onNavigate={() => setMobileOpen(false)}
        />
      </div>
      {mobileOpen && <button aria-label="Fechar lista de sites" onClick={() => setMobileOpen(false)} className="absolute inset-0 z-30 bg-black/40 lg:hidden" />}
      <main className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <Suspense
          fallback={
            <div className="flex flex-1 items-center justify-center">
              <Spinner size="lg" className="text-purple-600" />
            </div>
          }
        >
          <Outlet context={context} />
        </Suspense>
      </main>
    </div>
  )
}
