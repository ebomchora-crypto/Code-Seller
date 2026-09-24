import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '@/layouts/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthContext } from '@/stores/AuthContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuthContext()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!email || !password) {
      setError('Informe e-mail e senha.')
      return
    }

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
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-white">Entrar</h1>
        <p className="mt-1 text-sm text-neutral-400">Acesse sua conta para continuar</p>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <Input
          type="email"
          label="E-mail"
          placeholder="voce@empresa.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          labelClassName="text-neutral-300"
          className="border-white/[0.10] bg-white/[0.06] text-white placeholder:text-neutral-500 focus:border-purple-500/50 focus:bg-white/[0.08] focus:ring-purple-500/20"
        />
        <Input
          type="password"
          label="Senha"
          placeholder="••••••••"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          labelClassName="text-neutral-300"
          className="border-white/[0.10] bg-white/[0.06] text-white placeholder:text-neutral-500 focus:border-purple-500/50 focus:bg-white/[0.08] focus:ring-purple-500/20"
        />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm font-medium text-purple-400 hover:text-purple-300">
            Esqueceu a senha?
          </Link>
        </div>

        <Button type="submit" loading={loading} className="w-full shadow-purple-glow">
          Entrar
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-400">
        Ainda não tem conta?{' '}
        <Link to="/register" className="font-medium text-purple-400 hover:text-purple-300">
          Criar conta
        </Link>
      </p>
    </AuthLayout>
  )
}
