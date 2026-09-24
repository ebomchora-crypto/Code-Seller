import { useState } from 'react'
import { PageWrapper } from '@/components/ui/PageWrapper'
import { SectionLabel } from '@/components/ui/section-label'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ErrorState } from '@/components/ui/ErrorState'
import { ContactFilters } from '@/components/crm/ContactFilters'
import { ContactList } from '@/components/crm/ContactList'
import { ContactKanban } from '@/components/crm/ContactKanban'
import { ContactForm } from '@/components/crm/ContactForm'
import { ImportCSVModal } from '@/components/crm/ImportCSVModal'
import { useCRM } from '@/hooks/useCRM'
import { useTags } from '@/hooks/useTags'
import type { Contact } from '@/types'

function ListIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      className={`h-4 w-4 ${active ? 'text-purple-600' : 'text-neutral-400'}`}
    >
      <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

function KanbanIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      className={`h-4 w-4 ${active ? 'text-purple-600' : 'text-neutral-400'}`}
    >
      <rect x="3" y="4" width="5" height="16" rx="1" />
      <rect x="9.5" y="4" width="5" height="10" rx="1" />
      <rect x="16" y="4" width="5" height="13" rx="1" />
    </svg>
  )
}

export default function CrmPage() {
  const {
    contacts,
    total,
    loading,
    error,
    filters,
    setFilters,
    clearFilters,
    hasActiveFilters,
    view,
    setView,
    page,
    setPage,
    pageSize,
    sortColumn,
    sortDirection,
    setSort,
    refetch,
    deleteContact,
    updateStatus,
  } = useCRM()
  const { tags } = useTags()

  const [formOpen, setFormOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  function openCreateForm() {
    setEditingContact(null)
    setFormOpen(true)
  }

  function openEditForm(contact: Contact) {
    setEditingContact(contact)
    setFormOpen(true)
  }

  async function handleConfirmDelete() {
    if (!deletingContact) return
    setDeleting(true)
    await deleteContact(deletingContact.id)
    setDeleting(false)
    setDeletingContact(null)
  }

  return (
    <PageWrapper>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <SectionLabel>Contatos</SectionLabel>
            <h1 className="mt-2 flex items-baseline gap-3 font-display text-4xl font-bold tracking-tight text-[var(--text-primary)]">
              CRM
              <span className="text-lg font-normal text-[var(--text-muted)]">{total}</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-1">
              <button
                type="button"
                aria-label="Visualização em lista"
                aria-pressed={view === 'list'}
                onClick={() => setView('list')}
                className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${view === 'list' ? 'bg-[var(--purple-soft)]' : 'hover:bg-[var(--bg-muted)]'}`}
              >
                <ListIcon active={view === 'list'} />
              </button>
              <button
                type="button"
                aria-label="Visualização em kanban"
                aria-pressed={view === 'kanban'}
                onClick={() => setView('kanban')}
                className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${view === 'kanban' ? 'bg-purple-50' : 'hover:bg-neutral-50'}`}
              >
                <KanbanIcon active={view === 'kanban'} />
              </button>
            </div>

            <Button variant="secondary" onClick={() => setImportOpen(true)}>
              Importar CSV
            </Button>
            <Button magnetic onClick={openCreateForm}>+ Novo Contato</Button>
          </div>
        </div>

        <div className="mt-6">
          <ContactFilters
            filters={filters}
            onChange={setFilters}
            onClear={clearFilters}
            hasActiveFilters={hasActiveFilters}
            tags={tags}
            resultCount={total}
            loading={loading}
          />
        </div>

        <div className="mt-6">
          {error ? (
            <ErrorState message={error} onRetry={refetch} />
          ) : view === 'list' ? (
            <ContactList
              contacts={contacts}
              loading={loading}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={setSort}
              onEdit={openEditForm}
              onDeleteRequest={setDeletingContact}
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
            />
          ) : (
            <ContactKanban contacts={contacts} loading={loading} onStatusChange={updateStatus} />
          )}
        </div>

        <Drawer
          open={formOpen}
          onClose={() => setFormOpen(false)}
          title={editingContact ? 'Editar contato' : 'Novo contato'}
        >
          <ContactForm
            contact={editingContact ?? undefined}
            onCancel={() => setFormOpen(false)}
            onSuccess={() => {
              setFormOpen(false)
              void refetch()
            }}
          />
        </Drawer>

        <ImportCSVModal open={importOpen} onClose={() => setImportOpen(false)} onImported={() => void refetch()} />

        <ConfirmDialog
          open={deletingContact !== null}
          title="Excluir contato"
          message={`Tem certeza que deseja excluir "${deletingContact?.name}"? Essa ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          loading={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingContact(null)}
        />
    </PageWrapper>
  )
}
