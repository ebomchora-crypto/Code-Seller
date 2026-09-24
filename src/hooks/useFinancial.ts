import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  deleteTransaction as deleteTransactionService,
  getTransactions,
  markAsPaid as markAsPaidService,
} from '@/services/supabase/transactions'
import { getCashFlowChart, getFinancialMetrics } from '@/services/supabase/financialMetrics'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { generateTransactionsCSV } from '@/utils/financial'
import type { CashFlowDataPoint, FinancialMetrics, Transaction, TransactionFilters } from '@/types'

const DEFAULT_FILTERS: TransactionFilters = {
  search: '',
  type: 'all',
  status: 'all',
  category_id: '',
  payment_method: 'all',
  date_from: '',
  date_to: '',
}

export function useFinancial() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null)
  const [cashFlow, setCashFlow] = useState<CashFlowDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<TransactionFilters>(DEFAULT_FILTERS)

  const debouncedSearch = useDebouncedValue(filters.search, 300)
  const effectiveFilters = useMemo(() => ({ ...filters, search: debouncedSearch }), [filters, debouncedSearch])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [transactionsResult, metricsResult, cashFlowResult] = await Promise.all([
        getTransactions(effectiveFilters),
        getFinancialMetrics(),
        getCashFlowChart(),
      ])
      setTransactions(transactionsResult)
      setMetrics(metricsResult)
      setCashFlow(cashFlowResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar os dados financeiros.')
    } finally {
      setLoading(false)
    }
  }, [effectiveFilters])

  useEffect(() => {
    void fetchAll()
  }, [fetchAll])

  const updateFilters = useCallback((next: Partial<TransactionFilters>) => {
    setFilters((current) => ({ ...current, ...next }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
  }, [])

  const hasActiveFilters =
    filters.search !== '' ||
    filters.type !== 'all' ||
    filters.status !== 'all' ||
    filters.category_id !== '' ||
    filters.payment_method !== 'all' ||
    filters.date_from !== '' ||
    filters.date_to !== ''

  const markAsPaid = useCallback(async (id: string) => {
    const previous = transactions.find((transaction) => transaction.id === id)
    if (!previous) return

    setTransactions((current) =>
      current.map((transaction) =>
        transaction.id === id
          ? { ...transaction, status: 'paid', paid_at: new Date().toISOString() }
          : transaction,
      ),
    )

    try {
      await markAsPaidService(id)
      toast.success('Transação marcada como paga.')
    } catch (err) {
      setTransactions((current) =>
        current.map((transaction) => (transaction.id === id ? previous : transaction)),
      )
      toast.error(err instanceof Error ? err.message : 'Não foi possível marcar a transação como paga.')
    }
  }, [transactions])

  const removeTransaction = useCallback(async (id: string) => {
    try {
      await deleteTransactionService(id)
      setTransactions((current) => current.filter((transaction) => transaction.id !== id))
      toast.success('Transação excluída com sucesso.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível excluir a transação.')
    }
  }, [])

  const exportCSV = useCallback(() => {
    const csv = generateTransactionsCSV(transactions)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const today = new Date().toISOString().slice(0, 10)
    link.download = `code-sellers-financeiro-${today}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }, [transactions])

  return {
    transactions,
    metrics,
    cashFlow,
    loading,
    error,
    filters,
    setFilters: updateFilters,
    clearFilters,
    hasActiveFilters,
    refetch: fetchAll,
    markAsPaid,
    deleteTransaction: removeTransaction,
    exportCSV,
  }
}
