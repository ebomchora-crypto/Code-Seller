import { TriangleAlert } from 'lucide-react'
import { useAuthContext } from '@/stores/AuthContext'
import { useBilling } from '@/stores/BillingContext'
import { PLAN_PRICE_LABEL, checkoutUrl } from '@/services/supabase/billing'
import { openExternal } from '@/utils/openExternal'

function formatDay(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : ''
}

// Faixa no topo do painel: cobrança recusada ou assinatura cancelada.
export function BillingBanner() {
  const { user } = useAuthContext()
  const { status } = useBilling()
  if (!status || !['late', 'canceled_active'].includes(status.state)) return null

  const text =
    status.state === 'late'
      ? 'Não conseguimos cobrar sua assinatura. Atualize o pagamento para não perder o acesso.'
      : `Sua assinatura foi cancelada e vale até ${formatDay(status.next_charge_at)}.`

  return (
    <div
      className="flex shrink-0 flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-amber-500/12 px-4 py-2 text-center text-[12.5px] text-amber-600 dark:text-amber-300"
    >
      <span className="inline-flex items-center gap-1.5 font-medium">
        <TriangleAlert className="size-3.5" />
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
