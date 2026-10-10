import { Suspense, useEffect, useRef, useState } from 'react'
import { lazyPage } from '@/utils/lazyPage'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthContext } from '@/stores/AuthContext'
import { getOAuthErrorFromUrl } from '@/services/supabase/auth'
import { supabase } from '@/lib/supabaseClient'
import { Spinner } from '@/components/ui/Spinner'
import { isDesktopApp } from '@/utils/desktop'
import { AppLayout } from '@/layouts/AppLayout'
import { BillingGate } from '@/components/billing/BillingGate'

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
  if (isDesktopApp()) return false
  try {
    return sessionStorage.getItem('cs_desktop_handoff') === '1'
  } catch {
    return false
  }
}

type HandoffStatus = 'working' | 'done' | 'error'

// Login pedido pela IDE instalada: ela abre /?ide_port=…&ide_state=…; depois do login devolvemos um código de uso único
// para o endereço local da IDE (127.0.0.1), do mesmo jeito que o app de Windows.
type IdeHandoff = { port: number; state: string }
function readIdeHandoff(): IdeHandoff | null {
  try {
    const query = new URLSearchParams(window.location.search)
    const port = Number(query.get('ide_port')); const state = query.get('ide_state') ?? ''
    if (port && state) {
      if (Number.isInteger(port) && port >= 1024 && port <= 65535 && /^[a-f0-9]{32}$/.test(state)) sessionStorage.setItem('cs_ide_handoff', JSON.stringify({ port, state }))
      window.history.replaceState(null, '', window.location.pathname)
    }
    const saved = JSON.parse(sessionStorage.getItem('cs_ide_handoff') ?? 'null') as IdeHandoff | null
    return saved && Number.isInteger(saved.port) && /^[a-f0-9]{32}$/.test(saved.state) ? saved : null
  } catch {
    return null
  }
}

function HandoffScreen({ status }: { status: HandoffStatus }) {
  const copy = {
    working: { title: 'Conectando o app…', text: 'Só um instante.' },
    done: { title: 'Pronto! Pode voltar pro app', text: 'O Code Sellers já abriu conectado. Dá pra fechar esta aba.' },
    error: { title: 'Não deu pra conectar o app', text: 'Volte pro app e clique em "Entrar pelo navegador" de novo.' },
  }[status]

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 bg-[#0b0812] px-6 text-center text-white">
      <img src="/logo.png" alt="Code Sellers" className="h-10 w-10 object-contain" />
      <p className="text-lg font-semibold">{copy.title}</p>
      <p className="max-w-sm text-[14px] leading-6 text-white/60">{copy.text}</p>
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

  // Login feito no navegador a pedido do app de Windows (ver PublicRoute):
  // assim que autentica, pede um código de uso único e manda pro app pelo
  // protocolo codesellers://. O app troca o código por uma sessão própria —
  // a sessão deste navegador continua intacta. Roda no máximo uma vez: sem
  // o ref, cada renovação de token (nova referência de `user`) reabriria o
  // app em loop.
  const [desktopHandoff] = useState(readDesktopHandoffFlag)
  const [handoffStatus, setHandoffStatus] = useState<HandoffStatus>('working')
  const handoffStarted = useRef(false)
  const [ideHandoff] = useState(readIdeHandoff)
  const [ideStatus, setIdeStatus] = useState<HandoffStatus>('working')
  const ideStarted = useRef(false)

  useEffect(() => {
    if (!ideHandoff || loading || !user || ideStarted.current) return
    ideStarted.current = true
    try { sessionStorage.removeItem('cs_ide_handoff') } catch { /* some ao fechar a aba */ }
    void (async () => {
      const { data, error } = await supabase.functions.invoke<{ token_hash?: string }>('desktop-handoff', { method: 'POST' })
      if (error || !data?.token_hash) { setIdeStatus('error'); return }
      setIdeStatus('done')
      window.location.href = `http://127.0.0.1:${ideHandoff.port}/api/account/callback?token_hash=${encodeURIComponent(data.token_hash)}&state=${ideHandoff.state}`
    })()
  }, [ideHandoff, loading, user])

  useEffect(() => {
    if (!desktopHandoff || loading || !user || handoffStarted.current) return
    handoffStarted.current = true
    try {
      sessionStorage.removeItem('cs_desktop_handoff')
    } catch {
      // marca de uso único; se não der pra limpar, some ao fechar a aba
    }
    void (async () => {
      const { data, error } = await supabase.functions.invoke<{ token_hash?: string }>('desktop-handoff', {
        method: 'POST',
      })
      if (error || !data?.token_hash) {
        setHandoffStatus('error')
        return
      }
      window.location.href = `codesellers://auth-callback?token_hash=${encodeURIComponent(data.token_hash)}`
      setHandoffStatus('done')
      // Tenta fechar a aba sozinha (vale quando ela foi aberta pelo app).
      // Se o navegador bloquear, a mensagem na tela já diz que dá pra fechar.
      setTimeout(() => window.close(), 400)
    })()
  }, [desktopHandoff, loading, user])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" className="text-purple-600" />
      </div>
    )
  }

  // Dentro do app de Windows não existe landing: deslogado é sempre login.
  if (!user && isDesktopApp()) {
    return <Navigate to="/login" replace />
  }

  // Voltou do Google com erro: manda pro login, que mostra a mensagem.
  if (!user && getOAuthErrorFromUrl()) {
    return <Navigate to={`/login${location.search}${location.hash}`} replace />
  }

  if (desktopHandoff && user) {
    return <HandoffScreen status={handoffStatus} />
  }

  if (ideHandoff && !user) return <Navigate to="/login" replace />
  if (ideHandoff && user) {
    const copy = { working: 'Conectando a IDE…', done: 'Pronto! Voltando para a IDE…', error: 'Não deu para conectar a IDE. Volte nela e clique em "Entrar" de novo.' }[ideStatus]
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-[#0b0812] px-6 text-center text-white">
        <img src="/logo.png" alt="Code Sellers" className="h-10 w-10 object-contain" />
        <p className="text-lg font-semibold">{copy}</p>
      </div>
    )
  }

  return (
    <Suspense fallback={<RouteFallback />}>
      {user ? (
        <BillingGate>
          <AppLayout>
            <DashboardPage />
          </AppLayout>
        </BillingGate>
      ) : (
        <LandingPage />
      )}
    </Suspense>
  )
}
