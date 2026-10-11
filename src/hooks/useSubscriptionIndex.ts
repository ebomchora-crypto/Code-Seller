import { useEffect, useSyncExternalStore } from 'react'
import { getSubscriptions } from '@/services/supabase/subscriptions'
import type { ClientSubscription } from '@/types'

// Mensalidades ativas, carregadas uma vez e compartilhadas pelas telas (cartões do CRM e dos Negócios, métricas).
let current: ClientSubscription[] = []
let loaded = false
let loading = false
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

export async function refreshSubscriptionIndex(): Promise<void> {
  if (loading) return
  loading = true
  try {
    current = await getSubscriptions({ activeOnly: true })
  } catch {
    current = []
  } finally {
    loading = false
    loaded = true
    emit()
  }
}

export function useSubscriptionIndex(): ClientSubscription[] {
  useEffect(() => {
    if (!loaded && !loading) void refreshSubscriptionIndex()
  }, [])
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => current,
  )
}
