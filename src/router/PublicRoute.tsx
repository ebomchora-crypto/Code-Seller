import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthContext } from '@/stores/AuthContext'
import { Spinner } from '@/components/ui/Spinner'
import { DesktopLogin } from '@/components/auth/DesktopLogin'

interface PublicRouteProps {
  children: ReactNode
}

function isDesktopApp() {
  return typeof window !== 'undefined' && Boolean(window.codeSellersDesktop)
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { user, loading } = useAuthContext()
  const desktop = isDesktopApp()

  // Chegou aqui vindo do app (?desktop=1) num navegador normal: guarda a
  // marca pra o RootRoute devolver o login pro app depois de entrar.
  useEffect(() => {
    if (desktop) return
    if (new URLSearchParams(window.location.search).get('desktop') === '1') {
      try {
        sessionStorage.setItem('cs_desktop_handoff', '1')
      } catch {
        // Sem storage: o app só não reabre sozinho; o login na web funciona.
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

  // Dentro do app de Windows, login/cadastro/esqueci a senha viram uma tela
  // só, que manda a pessoa pro navegador.
  if (desktop) {
    return <DesktopLogin />
  }

  return <>{children}</>
}
