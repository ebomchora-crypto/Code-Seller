import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuthContext } from '@/stores/AuthContext'
import { getBillingStatus, type BillingStatus } from '@/services/supabase/billing'

interface BillingContextValue {
  status: BillingStatus | null
  loading: boolean
  refresh: () => Promise<BillingStatus | null>
}

const BillingContext = createContext<BillingContextValue | undefined>(undefined)

// Situação da assinatura da conta logada. Confere de novo quando a pessoa volta
// para a aba (ex.: depois de pagar na Kiwify).
export function BillingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthContext()
  const userId = user?.id ?? null
  const [status, setStatus] = useState<BillingStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!userId) {
      setStatus(null)
      setLoading(false)
      return null
    }
    try {
      const next = await getBillingStatus()
      setStatus(next)
      return next
    } catch {
      // Falha de rede não pode trancar quem paga: libera e confere de novo depois.
      setStatus((current) => current ?? { access: true, state: 'active', trial_ends_at: null, next_charge_at: null, subscription_status: null })
      return null
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Só troca de conta mostra o carregamento de novo (ver BillingGate).
  useEffect(() => {
    setStatus(null)
    setLoading(true)
    void refresh()
  }, [refresh])

  useEffect(() => {
    const onFocus = () => void refresh()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refresh])

  return <BillingContext.Provider value={{ status, loading, refresh }}>{children}</BillingContext.Provider>
}

export function useBilling(): BillingContextValue {
  const context = useContext(BillingContext)
  if (!context) throw new Error('useBilling must be used within a BillingProvider')
  return context
}
