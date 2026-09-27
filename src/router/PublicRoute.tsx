import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthContext } from '@/stores/AuthContext'
import { Spinner } from '@/components/ui/Spinner'

interface PublicRouteProps {
  children: ReactNode
}

function isDesktopApp() {
  return typeof window !== 'undefined' && Boolean(window.codeSellersDesktop)
}

// Constrói a URL que o navegador vai abrir, marcada com ?desktop=1 — é essa
// marca que o RootRoute usa depois do login pra saber que precisa devolver a
// sessão pro app (ver handoff em RootRoute.tsx).
function browserAuthUrl() {
  const params = new URLSearchParams(window.location.search)
  params.set('desktop', '1')
  return `${window.location.origin}${window.location.pathname}?${params.toString()}`
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { user, loading } = useAuthContext()
  const desktop = isDesktopApp()

  // Já dentro do app de Windows: em vez de mostrar o formulário embutido,
  // abre o navegador padrão — login e cadastro acontecem lá, como no site.
  useEffect(() => {
    if (!desktop || loading || user) return
    window.codeSellersDesktop?.openInBrowser(browserAuthUrl())
  }, [desktop, loading, user])

  // Chegou aqui vindo do app (?desktop=1) num navegador normal: guarda a
  // marca pra o RootRoute devolver a sessão pro app depois do login.
  useEffect(() => {
    if (desktop) return
    if (new URLSearchParams(window.location.search).get('desktop') === '1') {
      try {
        sessionStorage.setItem('cs_desktop_handoff', '1')
      } catch {
        // Sem storage: o app só não vai reabrir sozinho, mas o login no
        // navegador continua funcionando normalmente.
      }
    }
  }, [desktop])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" className="text-purple-600" />
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  if (desktop) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#0b0812] px-6 text-center text-white">
        <img src="/logo.png" alt="Code Sellers" className="h-10 w-10 object-contain" />
        <p className="text-lg font-semibold">Continue no navegador</p>
        <p className="max-w-sm text-[14px] leading-6 text-white/60">
          Abrimos seu navegador para você entrar ou criar sua conta. Depois de
          concluir, este app conecta sozinho.
        </p>
        <button
          type="button"
          onClick={() => window.codeSellersDesktop?.openInBrowser(browserAuthUrl())}
          className="mt-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-[13px] font-medium text-white/80 transition-colors hover:bg-white/[0.12] hover:text-white"
        >
          Abrir o navegador de novo
        </button>
      </div>
    )
  }

  return <>{children}</>
}
