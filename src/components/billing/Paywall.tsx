import { useState } from 'react'
import { Check, LoaderCircle, LogOut, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthContext } from '@/stores/AuthContext'
import { useBilling } from '@/stores/BillingContext'
import { PLAN_PRICE_LABEL, checkoutUrl } from '@/services/supabase/billing'
import { openExternal } from '@/utils/openExternal'

const INCLUDED = [
  'Buyers Hunter: empresas da sua cidade prontas para abordar',
  'CS Copilot: mensagens, respostas e follow-up com IA',
  'Code Maker: prévia de site pronta para mostrar ao cliente',
  'CRM, negócios, propostas online e financeiro',
  'Área do aluno com o método completo',
]

// Tela de quando o teste grátis acabou ou a assinatura não está em dia.
export function Paywall() {
  const { user, signOut } = useAuthContext()
  const { status, refresh } = useBilling()
  const [checking, setChecking] = useState(false)
  const neverPaid = !status?.subscription_status

  async function checkAgain() {
    setChecking(true)
    const next = await refresh()
    setChecking(false)
    if (next?.access) toast.success('Pagamento confirmado. Bem-vindo de volta!')
    else toast.message('Ainda não encontramos o pagamento. Se acabou de pagar, aguarde um minuto e confira de novo.')
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[var(--bg-primary)] px-4 py-10">
      <div className="w-full max-w-[440px]">
        <img src="/logo.png" alt="Code Sellers" className="mx-auto size-14 rounded-2xl" />
        <h1 className="mt-6 text-center font-display text-[26px] font-bold tracking-tight text-[var(--text-primary)]">
          {neverPaid ? 'Seu teste grátis acabou' : 'Sua assinatura não está ativa'}
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-center text-[14.5px] leading-relaxed text-[var(--text-muted)]">
          Assine para continuar vendendo. Seus contatos, negócios e sites continuam salvos.
        </p>

        <div className="mt-7 rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-secondary)] p-6 shadow-[0_24px_60px_-30px_rgba(91,33,182,0.55)]">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-text)]">Code Sellers</p>
          <p className="mt-2 flex items-baseline gap-1.5 text-[var(--text-primary)]">
            <span className="font-display text-[38px] font-bold tracking-tight">{PLAN_PRICE_LABEL}</span>
            <span className="text-[14px] text-[var(--text-muted)]">/mês</span>
          </p>
          <ul className="mt-5 flex flex-col gap-2.5">
            {INCLUDED.map((item) => (
              <li key={item} className="flex gap-2.5 text-[13.5px] leading-snug text-[var(--text-secondary)]">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                {item}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => openExternal(checkoutUrl(user?.email))}
            className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#8b5cf6,#6d28d9)] text-[15px] font-semibold text-white shadow-[0_12px_30px_-12px_rgba(124,58,237,0.9)] transition hover:brightness-110"
          >
            Assinar agora
          </button>
          <p className="mt-3 text-center text-[12px] leading-relaxed text-[var(--text-muted)]">
            Pague com o mesmo e-mail da sua conta: <span className="font-medium text-[var(--text-secondary)]">{user?.email}</span>.
            Cancele quando quiser.
          </p>
        </div>

        <div className="mt-5 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => void checkAgain()}
            disabled={checking}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--border-default)] px-4 text-[13px] font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)] disabled:opacity-60"
          >
            {checking ? <LoaderCircle className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Já paguei, liberar acesso
          </button>
          <button
            type="button"
            onClick={() => void signOut()}
            className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-[13px] font-medium text-[var(--text-muted)] transition hover:bg-[var(--bg-muted)]"
          >
            <LogOut className="size-4" />
            Sair
          </button>
        </div>
      </div>
    </div>
  )
}
