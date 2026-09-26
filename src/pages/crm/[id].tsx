import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { PageWrapper } from '@/components/ui/PageWrapper'
import { Spinner } from '@/components/ui/Spinner'
import { ErrorState } from '@/components/ui/ErrorState'
import { Drawer } from '@/components/ui/Drawer'
import { Card } from '@/components/ui/Card'
import { PanelHeader } from '@/components/ui/PanelHeader'
import { ContactDetail } from '@/components/crm/ContactDetail'
import { ContactForm } from '@/components/crm/ContactForm'
import { InteractionList } from '@/components/crm/InteractionList'
import { InteractionForm } from '@/components/crm/InteractionForm'
import { LinkedTasksSection } from '@/components/tasks/LinkedTasksSection'
import { useContact } from '@/hooks/useContact'
import { useTags } from '@/hooks/useTags'
import { SendMessageButton } from '@/components/messages/SendMessageButton'
import { FollowUpButton } from '@/components/followup/FollowUpButton'

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
          className="mb-5 inline-flex items-center gap-1.5 rounded-full py-1 pr-3 text-[13.5px] font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
        >
          <ChevronLeft className="size-4" />
          Contatos
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
          <ContactDetail
            contact={contact}
            allTags={tags}
            onUpdate={updateContact}
            onAddTag={addTag}
            onRemoveTag={removeTag}
            onCreateTag={createTag}
            onEdit={() => setEditOpen(true)}
            onDealLinked={() => void refetch()}
            actions={(buttonClass) => (
              <>
                <SendMessageButton
                  className={buttonClass}
                  target={{ contact: { id: contact.id, name: contact.name, phone: contact.phone, city: contact.city, niche: contact.niche } }}
                  onSent={() => void refetch()}
                />
                <FollowUpButton
                  className={buttonClass}
                  target={{ contact: { id: contact.id, name: contact.name, city: contact.city, niche: contact.niche } }}
                />
              </>
            )}
            extra={<LinkedTasksSection contactId={contact.id} contactName={contact.name} />}
            history={
              <Card>
                <PanelHeader
                  title="Histórico"
                  subtitle={`${contact.interactions?.length ?? 0} ${
                    contact.interactions?.length === 1 ? 'interação registrada' : 'interações registradas'
                  }`}
                />
                <InteractionForm
                  onSubmit={async (data) => {
                    await addInteraction(data)
                  }}
                />
                <div className="mt-6">
                  <InteractionList interactions={contact.interactions ?? []} onDelete={deleteInteraction} />
                </div>
              </Card>
            }
          />
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
