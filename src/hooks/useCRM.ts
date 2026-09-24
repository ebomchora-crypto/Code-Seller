import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  deleteContact as deleteContactService,
  getContacts,
  updateContactStatus as updateContactStatusService,
  type ContactSortColumn,
  type SortDirection,
} from '@/services/supabase/contacts'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import type { Contact, ContactFilters, ContactStatus, CRMView } from '@/types'

const DEFAULT_FILTERS: ContactFilters = {
  search: '',
  status: 'all',
  niche: '',
  origin: '',
  tag_id: '',
}

const PAGE_SIZE = 20

export function useCRM() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<ContactFilters>(DEFAULT_FILTERS)
  const [view, setView] = useState<CRMView>('list')
  const [page, setPage] = useState(1)
  const [sortColumn, setSortColumn] = useState<ContactSortColumn>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const debouncedSearch = useDebouncedValue(filters.search, 300)
  const effectiveFilters = useMemo(
    () => ({ ...filters, search: debouncedSearch }),
    [filters, debouncedSearch],
  )

  const fetchContacts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const pageSize = view === 'kanban' ? 500 : PAGE_SIZE
      const result = await getContacts({
        filters: effectiveFilters,
        sortColumn,
        sortDirection,
        page: view === 'kanban' ? 1 : page,
        pageSize,
      })
      setContacts(result.data)
      setTotal(result.count)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar os contatos.')
    } finally {
      setLoading(false)
    }
  }, [effectiveFilters, sortColumn, sortDirection, page, view])

  useEffect(() => {
    void fetchContacts()
  }, [fetchContacts])

  useEffect(() => {
    setPage(1)
  }, [effectiveFilters.search, effectiveFilters.status, effectiveFilters.niche, effectiveFilters.origin, effectiveFilters.tag_id])

  const updateFilters = useCallback((next: Partial<ContactFilters>) => {
    setFilters((current) => ({ ...current, ...next }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
  }, [])

  const removeContact = useCallback(async (id: string) => {
    try {
      await deleteContactService(id)
      setContacts((current) => current.filter((contact) => contact.id !== id))
      setTotal((current) => Math.max(0, current - 1))
      toast.success('Contato excluído com sucesso.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível excluir o contato.')
    }
  }, [])

  const updateStatus = useCallback(async (id: string, status: ContactStatus) => {
    const previous = contacts.find((contact) => contact.id === id)
    if (!previous) return

    setContacts((current) =>
      current.map((contact) => (contact.id === id ? { ...contact, status } : contact)),
    )

    try {
      await updateContactStatusService(id, status)
    } catch (err) {
      setContacts((current) =>
        current.map((contact) => (contact.id === id ? { ...contact, status: previous.status } : contact)),
      )
      toast.error(err instanceof Error ? err.message : 'Não foi possível atualizar o status.')
    }
  }, [contacts])

  const hasActiveFilters =
    filters.search !== '' ||
    filters.status !== 'all' ||
    filters.niche !== '' ||
    filters.origin !== '' ||
    filters.tag_id !== ''

  return {
    contacts,
    total,
    loading,
    error,
    filters,
    setFilters: updateFilters,
    clearFilters,
    hasActiveFilters,
    view,
    setView,
    page,
    setPage,
    pageSize: PAGE_SIZE,
    sortColumn,
    sortDirection,
    setSort: (column: ContactSortColumn) => {
      setSortDirection((current) => (sortColumn === column && current === 'asc' ? 'desc' : 'asc'))
      setSortColumn(column)
    },
    refetch: fetchContacts,
    deleteContact: removeContact,
    updateStatus,
  }
}
