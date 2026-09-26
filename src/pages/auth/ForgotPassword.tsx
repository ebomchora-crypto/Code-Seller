import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import { AuthLayout } from '@/layouts/AuthLayout'
import { AuthError, AuthField, AuthHeading, AuthSubmit } from '@/components/auth/AuthForm'
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
      <AuthHeading title="Recuperar senha" subtitle="Enviaremos um link de redefinição para o seu e-mail." />

      {sent ? (
        <div className="mt-9 flex gap-3 rounded-2xl border border-[#e4dcfb] bg-[#f6f2ff] p-4 text-[14px] leading-6 text-[#4c1d95]">
          <MailCheck className="mt-0.5 size-5 shrink-0 text-[#7c3aed]" />
          Se existir uma conta com o e-mail informado, você receberá um link para redefinir sua senha
          em instantes.
        </div>
      ) : (
        <form className="mt-9 flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
          <AuthField
            type="email"
            label="E-mail"
            placeholder="Digite seu e-mail"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />

          <AuthError message={error} />

          <AuthSubmit loading={loading}>Enviar link</AuthSubmit>
        </form>
      )}

      <p className="mt-8 text-center text-[14px] text-[#6b6875]">
        Lembrou a senha?{' '}
        <Link to="/login" className="font-medium text-[#7c3aed] transition hover:text-[#5b21b6]">
          Voltar ao login
        </Link>
      </p>
    </AuthLayout>
  )
}
