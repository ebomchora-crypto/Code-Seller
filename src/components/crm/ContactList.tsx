import { Link } from 'react-router-dom'
import { AnimatePresence } from 'motion/react'
import { FlipItem } from '@/components/motion/FlipItem'
import { StatusBadge } from '@/components/crm/StatusBadge'
import { TagBadge } from '@/components/crm/TagBadge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import type { ContactSortColumn, SortDirection } from '@/services/supabase/contacts'
import type { Contact } from '@/types'

interface ContactListProps {
  contacts: Contact[]
  loading: boolean
  sortColumn: ContactSortColumn
  sortDirection: SortDirection
  onSort: (column: ContactSortColumn) => void
  onEdit: (contact: Contact) => void
  onDeleteRequest: (contact: Contact) => void
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

const columns: { key: ContactSortColumn | null; label: string }[] = [
  { key: 'name', label: 'Nome' },
  { key: 'status', label: 'Status' },
  { key: null, label: 'Nicho' },
  { key: null, label: 'Cidade/Estado' },
  { key: null, label: 'Telefone' },
  { key: null, label: 'Tags' },
  { key: 'created_at', label: 'Criado em' },
  { key: null, label: 'Ações' },
]

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('pt-BR')
}

function SortIcon({ direction }: { direction: SortDirection }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={`h-3 w-3 transition-transform ${direction === 'asc' ? 'rotate-180' : ''}`}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
    </svg>
  )
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <tr key={index} className="border-b border-neutral-100">
          {columns.map((_column, columnIndex) => (
            <td key={columnIndex} className="px-4 py-3">
              <Skeleton className="h-4 w-full max-w-[120px]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export function ContactList({
  contacts,
  loading,
  sortColumn,
  sortDirection,
  onSort,
  onEdit,
  onDeleteRequest,
  page,
  pageSize,
  total,
  onPageChange,
}: ContactListProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  if (!loading && contacts.length === 0) {
    return (
      <EmptyState
        title="Nenhum contato encontrado"
        description="Adicione um novo contato ou ajuste os filtros para ver resultados aqui."
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-100">
              {columns.map((column) => (
                <th key={column.label} className="px-4 py-3 font-medium text-neutral-500">
                  {column.key ? (
                    <button
                      type="button"
                      onClick={() => onSort(column.key as ContactSortColumn)}
                      className="flex items-center gap-1 transition-colors hover:text-neutral-900"
                    >
                      {column.label}
                      {sortColumn === column.key && <SortIcon direction={sortDirection} />}
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows />
            ) : (
              <AnimatePresence initial={false}>
                {contacts.map((contact) => (
                <FlipItem
                  as="tr"
                  key={contact.id}
                  className="group border-b border-neutral-100 transition-colors duration-150 last:border-0 hover:bg-purple-50/60"
                >
                  <td className="px-4 py-3">
                    <Link to={`/crm/${contact.id}`} className="font-medium text-neutral-900 hover:text-purple-700">
                      {contact.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={contact.status} />
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{contact.niche ?? '—'}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    {[contact.city, contact.state].filter(Boolean).join(' / ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{contact.phone ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {contact.tags?.map((tag) => <TagBadge key={tag.id} tag={tag} />) ?? '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{formatDate(contact.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => onEdit(contact)}
                        className="text-xs font-medium text-neutral-500 hover:text-purple-700"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteRequest(contact)}
                        className="text-xs font-medium text-neutral-500 hover:text-red-600"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </FlipItem>
                ))}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked cards */}
      <div className="flex flex-col gap-3 p-3 md:hidden">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28 w-full" />)
          : contacts.map((contact) => (
              <div key={contact.id} className="rounded-lg border border-neutral-200 p-4">
                <div className="flex items-center justify-between">
                  <Link to={`/crm/${contact.id}`} className="font-medium text-neutral-900">
                    {contact.name}
                  </Link>
                  <StatusBadge status={contact.status} />
                </div>
                <p className="mt-1 text-xs text-neutral-500">
                  {[contact.niche, contact.city].filter(Boolean).join(' · ') || '—'}
                </p>
                {contact.tags && contact.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {contact.tags.map((tag) => <TagBadge key={tag.id} tag={tag} />)}
                  </div>
                )}
                <div className="mt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => onEdit(contact)}
                    className="text-xs font-medium text-neutral-500 hover:text-purple-700"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteRequest(contact)}
                    className="text-xs font-medium text-neutral-500 hover:text-red-600"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
      </div>

      {!loading && total > pageSize && (
        <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-3">
          <p className="text-xs text-neutral-500">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
              Anterior
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
