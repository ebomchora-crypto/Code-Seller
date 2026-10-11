import type { PaymentMethod } from './financial'

export type SubscriptionStatus = 'active' | 'paused' | 'canceled'

// Mensalidade de um cliente: nasce no negócio ou direto no cadastro do contato.
// As cobranças de cada mês aparecem sozinhas no Financeiro, em "A receber".
export interface ClientSubscription {
  id: string
  user_id: string
  contact_id: string | null
  deal_id: string | null
  title: string
  amount: number
  currency: string
  /** Vencimento da 1ª cobrança (YYYY-MM-DD); as outras seguem no mesmo dia dos meses seguintes. */
  start_date: string
  /** Quantidade de cobranças; null = sem prazo (continua até cancelar). */
  months: number | null
  status: SubscriptionStatus
  payment_method: PaymentMethod | null
  notes: string | null
  created_at: string
  updated_at: string
  contact?: { id: string; name: string } | null
  deal?: { id: string; title: string } | null
}

/** O que o formulário edita (negócio ou contato). */
export interface SubscriptionDraft {
  enabled: boolean
  title: string
  amount: string
  startDate: string
  /** '' = sem prazo; senão o número de meses. */
  months: string
  paymentMethod: PaymentMethod | ''
  notes: string
}
