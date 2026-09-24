import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageWrapper } from '@/components/ui/PageWrapper'
import { Spinner } from '@/components/ui/Spinner'
import { ErrorState } from '@/components/ui/ErrorState'
import { Drawer } from '@/components/ui/Drawer'
import { ContactDetail } from '@/components/crm/ContactDetail'
import { ContactForm } from '@/components/crm/ContactForm'
import { InteractionList } from '@/components/crm/InteractionList'
import { InteractionForm } from '@/components/crm/InteractionForm'
import { LinkedTasksSection } from '@/components/tasks/LinkedTasksSection'
import { useContact } from '@/hooks/useContact'
import { useTags } from '@/hooks/useTags'

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { contact, loading, error, refetch, updateContact, addInteraction, deleteInteraction, addTag, removeTag } =
    useContact(id)
  const { tags, createTag } = useTags()
  const [editOpen, setEditOpen] = useState(false)

  return (
    <PageWrapper>
        <Link
          to="/crm"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition-colors hover:text-purple-700"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
          </svg>
          Voltar para CRM
        </Link>

        {loading && (
          <div className="flex justify-center py-24">
            <Spinner size="lg" className="text-purple-600" />
          </div>
        )}

        {!loading && error && <ErrorState message={error} onRetry={refetch} />}

        {!loading && !error && !contact && (
          <ErrorState title="Contato não encontrado" message="Este contato não existe ou foi removido." />
        )}

        {!loading && contact && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <ContactDetail
                contact={contact}
                allTags={tags}
                onUpdate={updateContact}
                onAddTag={addTag}
                onRemoveTag={removeTag}
                onCreateTag={createTag}
                onEdit={() => setEditOpen(true)}
                onDealLinked={() => void refetch()}
              />
              <div className="mt-6">
                <LinkedTasksSection contactId={contact.id} contactName={contact.name} />
              </div>
            </div>

            <div className="lg:col-span-3">
              <p className="label-caps mb-3">Histórico de interações</p>
              <div className="mb-4">
                <InteractionForm
                  onSubmit={async (data) => {
                    await addInteraction(data)
                  }}
                />
              </div>
              <InteractionList interactions={contact.interactions ?? []} onDelete={deleteInteraction} />
            </div>
          </div>
        )}

        <Drawer open={editOpen} onClose={() => setEditOpen(false)} title="Editar contato">
          {contact && (
            <ContactForm
              contact={contact}
              onCancel={() => setEditOpen(false)}
              onSuccess={() => {
                setEditOpen(false)
                void refetch()
              }}
            />
          )}
        </Drawer>
    </PageWrapper>
  )
}
