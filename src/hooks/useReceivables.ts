import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  cancelReceivable as cancelReceivableService,
  getReceivables,
  markReceivableAsPaid as markReceivableAsPaidService,
  updateDueDate as updateDueDateService,
} from '@/services/supabase/receivables'
import type { PaymentMethod, Receivable, ReceivableStatus } from '@/types'

export function useReceivables() {
  const [receivables, setReceivables] = useState<Receivable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<ReceivableStatus | 'all'>('all')

  const fetchReceivables = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getReceivables(statusFilter)
      setReceivables(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar as contas a receber.')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    void fetchReceivables()
  }, [fetchReceivables])

  const markAsPaid = useCallback(async (id: string, paymentMethod: PaymentMethod, paidAt?: string, notes?: string) => {
    try {
      const result = await markReceivableAsPaidService(id, paymentMethod, paidAt, notes)
      setReceivables((current) => current.map((item) => (item.id === id ? result.receivable : item)))
      toast.success('Recebimento confirmado com sucesso.')
      return true
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível confirmar o recebimento.')
      return false
    }
  }, [])

  const cancelReceivable = useCallback(async (id: string) => {
    try {
      await cancelReceivableService(id)
      setReceivables((current) =>
        current.map((item) => (item.id === id ? { ...item, status: 'cancelled' } : item)),
      )
      toast.success('Conta a receber cancelada.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível cancelar a conta a receber.')
    }
  }, [])

  const updateDueDate = useCallback(async (id: string, due_date: string) => {
    try {
      const updated = await updateDueDateService(id, due_date)
      setReceivables((current) => current.map((item) => (item.id === id ? updated : item)))
      toast.success('Data de vencimento atualizada.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível atualizar o vencimento.')
    }
  }, [])

  return {
    receivables,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    refetch: fetchReceivables,
    markAsPaid,
    cancelReceivable,
    updateDueDate,
  }
}
