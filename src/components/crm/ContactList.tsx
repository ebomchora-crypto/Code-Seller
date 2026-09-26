import { Link } from 'react-router-dom'
import { AnimatePresence } from 'motion/react'
import { ChevronDown, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react'
import { FlipItem } from '@/components/motion/FlipItem'
import { StatusBadge } from '@/components/crm/StatusBadge'
import { TagBadge } from '@/components/crm/TagBadge'
import { InitialsAvatar } from '@/components/ui/InitialsAvatar'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
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

const columns: { key: ContactSortColumn | null; label: string; className?: string }[] = [
  { key: 'name', label: 'Contato' },
  { key: 'status', label: 'Status' },
  { key: null, label: 'Nicho' },
  { key: null, label: 'Cidade' },
  { key: null, label: 'Telefone' },
  { key: null, label: 'Tags' },
  { key: 'created_at', label: 'Criado em' },
  { key: null, label: '', className: 'w-24' },
]

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '')
}

function location(contact: Contact): string {
  return [contact.city, contact.state].filter(Boolean).join('/') || '—'
}

const iconButton =
  'flex size-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-muted)]'

function RowActions({ contact, onEdit, onDeleteRequest }: Pick<ContactListProps, 'onEdit' | 'onDeleteRequest'> & { contact: Contact }) {
  return (
    <>
      <button
        type="button"
        onClick={() => onEdit(contact)}
        aria-label={`Editar ${contact.name}`}
        title="Editar"
        className={`${iconButton} hover:text-[var(--accent-text)]`}
      >
        <Pencil className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => onDeleteRequest(contact)}
        aria-label={`Excluir ${contact.name}`}
        title="Excluir"
        className={`${iconButton} hover:text-red-500`}
      >
        <Trash2 className="size-4" />
      </button>
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
    <div className="overflow-hidden rounded-[var(--card-radius)] border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-[var(--shadow-card)]">
      {/* Desktop */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-[13.5px]">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] bg-black/[0.02] dark:bg-white/[0.02]">
              {columns.map((column) => (
                <th
                  key={column.label || 'actions'}
                  className={`whitespace-nowrap px-4 py-3 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] first:pl-5 ${column.className ?? ''}`}
                >
                  {column.key ? (
                    <button
                      type="button"
                      onClick={() => onSort(column.key as ContactSortColumn)}
                      className={`inline-flex items-center gap-1 uppercase transition-colors hover:text-[var(--text-primary)] ${
                        sortColumn === column.key ? 'text-[var(--text-secondary)]' : ''
                      }`}
                    >
                      {column.label}
                      {sortColumn === column.key && (
                        <ChevronDown className={`size-3.5 transition-transform ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                      )}
                    </button>
                  ) : (
                    column.label || <span className="sr-only">Ações</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <tr key={index} className="border-b border-[var(--border-subtle)] last:border-0">
                  <td className="py-3.5 pl-5 pr-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-9 rounded-[10px]" />
                      <Skeleton className="h-4 w-36" />
                    </div>
                  </td>
                  {columns.slice(1).map((_column, columnIndex) => (
                    <td key={columnIndex} className="px-4 py-3.5">
                      <Skeleton className="h-4 w-full max-w-[96px]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <AnimatePresence initial={false}>
                {contacts.map((contact) => (
                  <FlipItem
                    as="tr"
                    key={contact.id}
                    className="group border-b border-[var(--border-subtle)] transition-colors duration-150 last:border-0 hover:bg-black/[0.025] dark:hover:bg-white/[0.03]"
                  >
                    <td className="py-3 pl-5 pr-4">
                      <Link to={`/crm/${contact.id}`} className="flex min-w-0 items-center gap-3">
                        <InitialsAvatar name={contact.name} size="sm" />
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent-text)]">
                            {contact.name}
                          </span>
                          {contact.email && (
                            <span className="block max-w-[220px] truncate text-[12px] text-[var(--text-muted)]">{contact.email}</span>
                          )}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={contact.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[var(--text-secondary)]">{contact.niche ?? '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-[var(--text-secondary)]">{location(contact)}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-[var(--text-secondary)]">{contact.phone ?? '—'}</td>
                    <td className="px-4 py-3">
                      {contact.tags && contact.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {contact.tags.map((tag) => (
                            <TagBadge key={tag.id} tag={tag} />
                          ))}
                        </div>
                      ) : (
                        <span className="text-[var(--text-muted)]">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[var(--text-muted)]">{formatDate(contact.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1 opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover:opacity-100">
                        <RowActions contact={contact} onEdit={onEdit} onDeleteRequest={onDeleteRequest} />
                      </div>
                    </td>
                  </FlipItem>
                ))}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <ul className="flex flex-col divide-y divide-[var(--border-subtle)] md:hidden">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <li key={index} className="flex items-center gap-3 p-4">
                <Skeleton className="size-10 rounded-xl" />
                <Skeleton className="h-4 flex-1" />
              </li>
            ))
          : contacts.map((contact) => (
              <li key={contact.id} className="flex items-start gap-3 p-4">
                <InitialsAvatar name={contact.name} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/crm/${contact.id}`} className="min-w-0 truncate font-medium text-[var(--text-primary)]">
                      {contact.name}
                    </Link>
                    <StatusBadge status={contact.status} />
                  </div>
                  <p className="mt-0.5 truncate text-[12.5px] text-[var(--text-muted)]">
                    {[contact.niche, contact.city].filter(Boolean).join(' · ') || '—'}
                  </p>
                  {contact.tags && contact.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {contact.tags.map((tag) => (
                        <TagBadge key={tag.id} tag={tag} />
                      ))}
                    </div>
                  )}
                  <div className="-ml-2 mt-2 flex gap-1">
                    <RowActions contact={contact} onEdit={onEdit} onDeleteRequest={onDeleteRequest} />
                  </div>
                </div>
              </li>
            ))}
      </ul>

      {!loading && total > pageSize && (
        <div className="flex items-center justify-between border-t border-[var(--border-subtle)] px-5 py-3">
          <p className="text-[12.5px] text-[var(--text-muted)]">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              aria-label="Página anterior"
              className="flex size-9 items-center justify-center rounded-full border border-[var(--border-default)] text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              aria-label="Próxima página"
              className="flex size-9 items-center justify-center rounded-full border border-[var(--border-default)] text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
