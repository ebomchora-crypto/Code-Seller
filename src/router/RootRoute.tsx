import { Suspense, useEffect, useRef, useState } from 'react'
import { lazyPage } from '@/utils/lazyPage'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthContext } from '@/stores/AuthContext'
import { getOAuthErrorFromUrl } from '@/services/supabase/auth'
import { supabase } from '@/lib/supabaseClient'
import { Spinner } from '@/components/ui/Spinner'
import { AppLayout } from '@/layouts/AppLayout'

const DashboardPage = lazyPage(() => import('@/pages/dashboard'))
const LandingPage = lazyPage(() => import('@/pages/landing'))

function RouteFallback() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Spinner size="lg" className="text-purple-600" />
    </div>
  )
}

function readDesktopHandoffFlag(): boolean {
  if (typeof window !== 'undefined' && window.codeSellersDesktop) return false
  try {
    return sessionStorage.getItem('cs_desktop_handoff') === '1'
  } catch {
    return false
  }
}

// A rota "/" mostra conteúdo diferente conforme o estado de autenticação —
// padrão comum em SaaS (Linear, Notion): deslogado vê a landing pública,
// logado vê o Dashboard. Evita mexer nos lugares que já tratam "/" como
// home autenticada (navConfig, PublicRoute, redirects de login/registro).
export function RootRoute() {
  const { user, loading } = useAuthContext()
  const location = useLocation()

  // Login feito no navegador a pedido do app de Windows (ver PublicRoute):
  // assim que autentica, devolve a sessão pro app via protocolo próprio
  // (codesellers://) em vez de mostrar o Dashboard nesta aba. Só pode
  // acontecer uma vez — sem o guard de ref, qualquer renovação de token
  // (troca de aba, o Supabase atualiza o access token sozinho de tempos em
  // tempos) muda a referência de `user` e reexecutaria o efeito, reabrindo
  // o app em loop.
  const [desktopHandoff] = useState(readDesktopHandoffFlag)
  const handoffDone = useRef(false)

  useEffect(() => {
    if (!desktopHandoff || loading || !user || handoffDone.current) return
    handoffDone.current = true
    void (async () => {
      const { data } = await supabase.auth.getSession()
      const session = data.session
      try {
        sessionStorage.removeItem('cs_desktop_handoff')
      } catch {
        // sem problema, é só uma marca de uso único
      }
      if (!session?.access_token || !session.refresh_token) return
      const url = `codesellers://auth-callback?access_token=${encodeURIComponent(session.access_token)}&refresh_token=${encodeURIComponent(session.refresh_token)}`
      window.location.href = url
      // Tenta fechar a aba sozinha — funciona quando o navegador considera
      // que foi aberta "por fora" (é o caso aqui, veio do app). Se o
      // navegador bloquear, a mensagem na tela já diz que dá pra fechar.
      setTimeout(() => window.close(), 300)
    })()
  }, [desktopHandoff, loading, user])

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

  if (desktopHandoff && user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-[#0b0812] px-6 text-center text-white">
        <img src="/logo.png" alt="Code Sellers" className="h-10 w-10 object-contain" />
        <p className="text-lg font-semibold">Pronto! Pode voltar pro app</p>
        <p className="max-w-sm text-[14px] leading-6 text-white/60">
          O Code Sellers já deve ter aberto sozinho, conectado. Dá pra fechar
          esta aba.
        </p>
      </div>
    )
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
