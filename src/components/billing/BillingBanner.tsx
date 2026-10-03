import { Sparkles, TriangleAlert } from 'lucide-react'
import { useAuthContext } from '@/stores/AuthContext'
import { useBilling } from '@/stores/BillingContext'
import { PLAN_PRICE_LABEL, checkoutUrl, daysLeft } from '@/services/supabase/billing'
import { openExternal } from '@/utils/openExternal'

function formatDay(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : ''
}

// Faixa no topo do painel: dias de teste grátis, cobrança recusada ou assinatura cancelada.
export function BillingBanner() {
  const { user } = useAuthContext()
  const { status } = useBilling()
  if (!status || !['trial', 'late', 'canceled_active'].includes(status.state)) return null

  const days = daysLeft(status.trial_ends_at)
  const warning = status.state !== 'trial'
  const text =
    status.state === 'trial'
      ? days <= 1
        ? 'Último dia do seu teste grátis.'
        : `Teste grátis: faltam ${days} dias.`
      : status.state === 'late'
        ? 'Não conseguimos cobrar sua assinatura. Atualize o pagamento para não perder o acesso.'
        : `Sua assinatura foi cancelada e vale até ${formatDay(status.next_charge_at)}.`

  return (
    <div
      className={`flex shrink-0 flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center text-[12.5px] ${
        warning ? 'bg-amber-500/12 text-amber-600 dark:text-amber-300' : 'bg-[var(--accent-tint)] text-[var(--accent-text)]'
      }`}
    >
      <span className="inline-flex items-center gap-1.5 font-medium">
        {warning ? <TriangleAlert className="size-3.5" /> : <Sparkles className="size-3.5" />}
        {text}
      </span>
      <button
        type="button"
        onClick={() => openExternal(checkoutUrl(user?.email))}
        className="rounded-full bg-[linear-gradient(135deg,#8b5cf6,#6d28d9)] px-3 py-1 text-[12px] font-semibold text-white transition hover:brightness-110"
      >
        {status.state === 'late' ? 'Pagar agora' : `Assinar · ${PLAN_PRICE_LABEL}/mês`}
      </button>
    </div>
  )
}
