import type { ReactNode } from 'react'
import { useBilling } from '@/stores/BillingContext'
import { Spinner } from '@/components/ui/Spinner'
import { Paywall } from '@/components/billing/Paywall'

// Só deixa entrar no sistema com teste grátis válido ou assinatura em dia.
export function BillingGate({ children }: { children: ReactNode }) {
  const { status, loading } = useBilling()
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" className="text-purple-600" />
      </div>
    )
  }
  if (status && !status.access) return <Paywall />
  return <>{children}</>
}
