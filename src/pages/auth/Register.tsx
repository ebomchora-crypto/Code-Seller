import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '@/layouts/AuthLayout'
import {
  AuthDivider,
  AuthError,
  AuthField,
  AuthHeading,
  AuthSubmit,
  GoogleButton,
  PasswordField,
} from '@/components/auth/AuthForm'
import { setRememberSession } from '@/lib/supabaseClient'
import { useAuthContext } from '@/stores/AuthContext'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { signUp } = useAuthContext()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!name || !email || !password || !confirmPassword) {
      setError('Preencha todos os campos.')
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setRememberSession(true)
    setLoading(true)
    const { error: signUpError } = await signUp(email, password, name)
    setLoading(false)

    if (signUpError) {
      setError(signUpError)
      return
    }

    navigate('/', { replace: true })
  }

  return (
    <AuthLayout>
      <AuthHeading title="Crie sua conta" subtitle="Organize suas vendas do primeiro contato ao pagamento." />

      <form className="mt-9 flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        <AuthField
          label="Nome"
          placeholder="Digite seu nome"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
        />
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
          placeholder="Mínimo de 6 caracteres"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
        />
        <PasswordField
          label="Confirmar senha"
          placeholder="Repita a senha"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          autoComplete="new-password"
        />

        <AuthError message={error} />

        <AuthSubmit loading={loading}>Criar conta</AuthSubmit>
      </form>

      <div className="mt-7 flex flex-col gap-5">
        <AuthDivider>Ou continue com</AuthDivider>
        <GoogleButton onBeforeRedirect={() => setRememberSession(true)} onError={setError} />
      </div>

      <p className="mt-8 text-center text-[14px] text-[#6b6875]">
        Já tem conta?{' '}
        <Link to="/login" className="font-medium text-[#7c3aed] transition hover:text-[#5b21b6]">
          Entrar
        </Link>
      </p>
    </AuthLayout>
  )
}
