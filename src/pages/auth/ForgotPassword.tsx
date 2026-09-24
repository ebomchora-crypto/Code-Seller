import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '@/layouts/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { resetPasswordForEmail } from '@/services/supabase/auth'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!email) {
      setError('Informe seu e-mail.')
      return
    }

    setLoading(true)
    const response = await resetPasswordForEmail(email)
    setLoading(false)

    if (response.error) {
      setError(response.error)
      return
    }

    setSent(true)
  }

  return (
    <AuthLayout>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-white">Recuperar senha</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Enviaremos um link de redefinição para o seu e-mail
        </p>
      </div>

      {sent ? (
        <div className="rounded-lg border border-purple-500/20 bg-purple-500/10 px-4 py-3 text-sm text-purple-300">
          Se existir uma conta com o e-mail informado, você receberá um link para redefinir sua
          senha em instantes.
        </div>
      ) : (
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

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button type="submit" loading={loading} className="w-full shadow-purple-glow">
            Enviar link
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-neutral-400">
        Lembrou a senha?{' '}
        <Link to="/login" className="font-medium text-purple-400 hover:text-purple-300">
          Voltar ao login
        </Link>
      </p>
    </AuthLayout>
  )
}
