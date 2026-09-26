import { lazy, Suspense } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthContext } from '@/stores/AuthContext'
import { getOAuthErrorFromUrl } from '@/services/supabase/auth'
import { Spinner } from '@/components/ui/Spinner'
import { AppLayout } from '@/layouts/AppLayout'

const DashboardPage = lazy(() => import('@/pages/dashboard'))
const LandingPage = lazy(() => import('@/pages/landing'))

function RouteFallback() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Spinner size="lg" className="text-purple-600" />
    </div>
  )
}

// A rota "/" mostra conteúdo diferente conforme o estado de autenticação —
// padrão comum em SaaS (Linear, Notion): deslogado vê a landing pública,
// logado vê o Dashboard. Evita mexer nos lugares que já tratam "/" como
// home autenticada (navConfig, PublicRoute, redirects de login/registro).
export function RootRoute() {
  const { user, loading } = useAuthContext()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" className="text-purple-600" />
      </div>
    )
  }

  // Voltou do Google com erro: manda pro login, que mostra a mensagem.
  if (!user && getOAuthErrorFromUrl()) {
    return <Navigate to={`/login${location.search}${location.hash}`} replace />
  }

  return (
    <Suspense fallback={<RouteFallback />}>
      {user ? (
        <AppLayout>
          <DashboardPage />
        </AppLayout>
      ) : (
        <LandingPage />
      )}
    </Suspense>
  )
}
