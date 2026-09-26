import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '@/layouts/AuthLayout'
import {
  AuthCheckbox,
  AuthDivider,
  AuthError,
  AuthField,
  AuthHeading,
  AuthSubmit,
  GoogleButton,
  PasswordField,
} from '@/components/auth/AuthForm'
import { setRememberSession } from '@/lib/supabaseClient'
import { getOAuthErrorFromUrl } from '@/services/supabase/auth'
import { useAuthContext } from '@/stores/AuthContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuthContext()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Erro vindo do retorno do Google: mostra e limpa a URL.
  useEffect(() => {
    const oauthError = getOAuthErrorFromUrl()
    if (!oauthError) return
    setError(oauthError)
    window.history.replaceState(null, '', '/login')
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!email || !password) {
      setError('Informe e-mail e senha.')
      return
    }

    setRememberSession(remember)
    setLoading(true)
    const { error: signInError } = await signIn(email, password)
    setLoading(false)

    if (signInError) {
      setError(signInError)
      return
    }

    navigate('/', { replace: true })
  }

  return (
    <AuthLayout>
      <AuthHeading title="Boas-vindas" subtitle="Acesse sua conta e continue de onde parou." />

      <form className="mt-9 flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        <AuthField
          type="email"
          label="E-mail"
          placeholder="Digite seu e-mail"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
        />
        <PasswordField
          label="Senha"
          placeholder="Digite sua senha"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
        />

        <div className="flex items-center justify-between gap-4">
          <AuthCheckbox checked={remember} onChange={setRemember}>
            Manter conectado
          </AuthCheckbox>
          <Link to="/forgot-password" className="text-[14px] font-medium text-[#7c3aed] transition hover:text-[#5b21b6]">
            Esqueceu a senha?
          </Link>
        </div>

        <AuthError message={error} />

        <AuthSubmit loading={loading}>Entrar</AuthSubmit>
      </form>

      <div className="mt-7 flex flex-col gap-5">
        <AuthDivider>Ou continue com</AuthDivider>
        <GoogleButton onBeforeRedirect={() => setRememberSession(remember)} onError={setError} />
      </div>

      <p className="mt-8 text-center text-[14px] text-[#6b6875]">
        Novo por aqui?{' '}
        <Link to="/register" className="font-medium text-[#7c3aed] transition hover:text-[#5b21b6]">
          Criar conta
        </Link>
      </p>
    </AuthLayout>
  )
}
