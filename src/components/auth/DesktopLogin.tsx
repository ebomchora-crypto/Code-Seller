import { useEffect, useState } from 'react'
import { ExternalLink, Loader2 } from 'lucide-react'
import { AuthLayout } from '@/layouts/AuthLayout'
import { AuthDivider, AuthError, AuthHeading } from '@/components/auth/AuthForm'
import { DESKTOP_AUTH_ERROR_EVENT } from '@/lib/supabaseClient'

// Tela de acesso do app de Windows. Mesmo visual do login da web, mas sem
// formulário: login e cadastro acontecem no navegador, que devolve o app
// pra frente já conectado (ver RootRoute — handoff).
function browserUrl(path: '/login' | '/register') {
  return `${window.location.origin}${path}?desktop=1`
}

export function DesktopLogin() {
  const [waiting, setWaiting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onError = () => {
      setWaiting(false)
      setError('Não foi possível entrar. O link pode ter expirado — tente de novo.')
    }
    window.addEventListener(DESKTOP_AUTH_ERROR_EVENT, onError)
    return () => window.removeEventListener(DESKTOP_AUTH_ERROR_EVENT, onError)
  }, [])

  function open(path: '/login' | '/register') {
    setError(null)
    setWaiting(true)
    window.codeSellersDesktop?.openInBrowser(browserUrl(path))
  }

  return (
    <AuthLayout>
      <AuthHeading
        title="Boas-vindas"
        subtitle="Entre pelo seu navegador — é rapidinho, e você volta pra cá já conectado."
      />

      <div className="mt-9 flex flex-col gap-5">
        <AuthError message={error} />

        <button
          type="button"
          onClick={() => open('/login')}
          className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#111014] text-[15px] font-medium text-[#fff] transition hover:bg-[#000]"
        >
          {waiting ? <Loader2 className="size-4 animate-spin" /> : <ExternalLink className="size-4" />}
          {waiting ? 'Aguardando o login no navegador…' : 'Entrar pelo navegador'}
        </button>

        {waiting && (
          <p className="text-center text-[13px] leading-5 text-[#6b6875]">
            Não abriu?{' '}
            <button
              type="button"
              onClick={() => open('/login')}
              className="font-medium text-[#7c3aed] transition hover:text-[#5b21b6]"
            >
              Abrir o navegador de novo
            </button>
          </p>
        )}
      </div>

      <div className="mt-7 flex flex-col gap-5">
        <AuthDivider>Novo por aqui?</AuthDivider>
        <button
          type="button"
          onClick={() => open('/register')}
          className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-[#e4e2ea] bg-[#fff] text-[15px] font-medium text-[#1f1d24] transition hover:border-[#d6d3de] hover:bg-[#f8f7fa]"
        >
          Criar conta
        </button>
      </div>
    </AuthLayout>
  )
}
