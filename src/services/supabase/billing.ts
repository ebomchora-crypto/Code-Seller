import { supabase } from '@/lib/supabaseClient'

// Situação da assinatura da conta logada (função billing_status no banco).
export type BillingState = 'exempt' | 'active' | 'late' | 'canceled_active' | 'trial' | 'expired' | 'signed_out'

export interface BillingStatus {
  access: boolean
  state: BillingState
  trial_ends_at: string | null
  next_charge_at: string | null
  subscription_status: string | null
}

export const PLAN_PRICE_LABEL = 'R$ 99,90'
const CHECKOUT_URL = 'https://pay.kiwify.com.br/uosSeHM'

/** Página de pagamento, já com o e-mail da conta (é por ele que o pagamento é ligado à conta). */
export function checkoutUrl(email: string | null | undefined): string {
  return email ? `${CHECKOUT_URL}?email=${encodeURIComponent(email)}` : CHECKOUT_URL
}

export async function getBillingStatus(): Promise<BillingStatus> {
  const { data, error } = await supabase.rpc('billing_status')
  if (error) throw new Error(error.message)
  return data as BillingStatus
}

/** Dias inteiros que faltam até a data (0 no último dia). */
export function daysLeft(iso: string | null): number {
  if (!iso) return 0
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000))
}
