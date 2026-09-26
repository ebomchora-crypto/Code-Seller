import { useState } from 'react'
import { Columns3, List, Plus, Upload, Users } from 'lucide-react'
import { PageHeader, PageWrapper } from '@/components/ui/PageWrapper'
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
import { useOpenOnParam } from '@/hooks/useOpenOnParam'

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
  useOpenOnParam(openCreateForm)


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
        <PageHeader
          title="Contatos"
          count={total}
          subtitle="Leads e clientes que você está acompanhando, do primeiro contato ao fechamento."
          actions={
            <>
              <div
                role="group"
                aria-label="Modo de visualização"
                className="flex h-11 items-center gap-1 rounded-full border border-[var(--border-default)] bg-[var(--bg-card)] p-1"
              >
                {(
                  [
                    { value: 'list', label: 'Lista', icon: List },
                    { value: 'kanban', label: 'Kanban', icon: Columns3 },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={view === option.value}
                    onClick={() => setView(option.value)}
                    className={`flex h-full items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-colors ${
                      view === option.value
                        ? 'bg-[var(--accent-tint)] text-[var(--accent-text)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <option.icon className="size-4" />
                    {option.label}
                  </button>
                ))}
              </div>

              <Button variant="secondary" className="h-11 rounded-full px-4" onClick={() => setImportOpen(true)}>
                <Upload className="size-4" />
                Importar CSV
              </Button>
              <Button magnetic className="h-11 rounded-full px-5" onClick={openCreateForm}>
                <Plus className="size-4" strokeWidth={2.4} />
                Novo contato
              </Button>
            </>
          }
        />

        <div className="mt-8">
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
          ) : !loading && total === 0 && !hasActiveFilters ? (
            <div className="flex flex-col items-center rounded-[var(--card-radius)] border border-dashed border-[var(--border-default)] px-6 py-16 text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-[var(--accent-tint)] text-[var(--accent-text)]">
                <Users className="size-6" />
              </span>
              <h2 className="mt-5 font-display text-[20px] font-semibold tracking-tight text-[var(--text-primary)]">
                Seu CRM ainda está vazio
              </h2>
              <p className="mt-2 max-w-md text-[14px] leading-relaxed text-[var(--text-muted)]">
                Cadastre seu primeiro lead ou traga sua lista de uma planilha. Daqui você acompanha cada conversa até
                virar cliente.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2.5">
                <Button className="h-11 rounded-full px-5" onClick={openCreateForm}>
                  <Plus className="size-4" strokeWidth={2.4} />
                  Novo contato
                </Button>
                <Button variant="secondary" className="h-11 rounded-full px-4" onClick={() => setImportOpen(true)}>
                  <Upload className="size-4" />
                  Importar CSV
                </Button>
              </div>
            </div>
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
