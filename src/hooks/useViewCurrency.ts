import { useSyncExternalStore } from 'react'
import { getViewCurrency, setViewCurrency, subscribeViewCurrency, type CurrencyCode } from '@/utils/currency'

// Moeda escolhida para os totais. A tela que usa este hook redesenha (e busca
// de novo) quando a moeda muda em qualquer lugar do app.
export function useViewCurrency(): [CurrencyCode, (code: CurrencyCode) => void] {
  const currency = useSyncExternalStore(subscribeViewCurrency, getViewCurrency, getViewCurrency)
  return [currency, setViewCurrency]
}
