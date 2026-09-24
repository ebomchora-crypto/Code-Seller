import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { StatusBadge } from '@/components/crm/StatusBadge'
import { TagManager } from '@/components/crm/TagManager'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { deleteContact } from '@/services/supabase/contacts'
import { getUnlinkedDeals, linkDealToContact } from '@/services/supabase/deals'
import { CONTACT_STATUS_LABELS, CONTACT_STATUSES, type Contact, type ContactStatus, type Deal, type Tag } from '@/types'

interface ContactDetailProps {
  contact: Contact
  allTags: Tag[]
  onUpdate: (data: Partial<Contact>) => Promise<boolean | undefined>
  onAddTag: (tag: Tag) => Promise<void>
  onRemoveTag: (tagId: string) => Promise<void>
  onCreateTag: (name: string, color: string) => Promise<Tag | null>
  onEdit: () => void
  onDealLinked: (deal: Deal) => void
}

const dealStatusLabels: Record<Deal['status'], string> = {
  open: 'Em aberto',
  won: 'Ganho',
  lost: 'Perdido',
  paused: 'Pausado',
}

function formatCurrency(value: number | null): string {
  if (value === null) return '—'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('pt-BR')
}

export function ContactDetail({
  contact,
  allTags,
  onUpdate,
  onAddTag,
  onRemoveTag,
  onCreateTag,
  onEdit,
  onDealLinked,
}: ContactDetailProps) {
  const navigate = useNavigate()
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)
  const statusRef = useRef<HTMLDivElement>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [dealPickerOpen, setDealPickerOpen] = useState(false)
  const [availableDeals, setAvailableDeals] = useState<Deal[]>([])
  const [loadingDeals, setLoadingDeals] = useState(false)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setStatusMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleStatusChange(status: ContactStatus) {
    setStatusMenuOpen(false)
    if (status === contact.status) return
    await onUpdate({ status })
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteContact(contact.id)
      toast.success('Contato excluído com sucesso.')
      navigate('/crm', { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível excluir o contato.')
      setDeleting(false)
    }
  }

  async function openDealPicker() {
    setDealPickerOpen(true)
    setLoadingDeals(true)
    try {
      const deals = await getUnlinkedDeals()
      setAvailableDeals(deals)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível carregar os negócios.')
    } finally {
      setLoadingDeals(false)
    }
  }

  async function handleLinkDeal(deal: Deal) {
    try {
      const updated = await linkDealToContact(deal.id, contact.id)
      onDealLinked(updated)
      toast.success('Negócio vinculado com sucesso.')
      setDealPickerOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível vincular o negócio.')
    }
  }

  const infoFields: { label: string; value: string }[] = [
    { label: 'E-mail', value: contact.email ?? '—' },
    { label: 'Telefone', value: contact.phone ?? '—' },
    { label: 'Nicho', value: contact.niche ?? '—' },
    { label: 'Cidade/Estado', value: [contact.city, contact.state].filter(Boolean).join(' / ') || '—' },
    { label: 'Origem', value: contact.origin ?? '—' },
    { label: 'Site atual', value: contact.current_site ?? '—' },
    { label: 'Criado em', value: formatDate(contact.created_at) },
  ]

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-medium tracking-tightest text-neutral-900">{contact.name}</h1>
            <div ref={statusRef} className="relative mt-2 inline-block">
              <StatusBadge status={contact.status} onClick={() => setStatusMenuOpen((value) => !value)} />
              {statusMenuOpen && (
                <div className="absolute left-0 top-full z-20 mt-2 w-40 animate-fade-in overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg">
                  {CONTACT_STATUSES.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => handleStatusChange(status)}
                      className="block w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-purple-50"
                    >
                      {CONTACT_STATUS_LABELS[status]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="ghost" size="sm" onClick={onEdit}>
              Editar
            </Button>
            <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
              Deletar
            </Button>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {infoFields.map((field) => (
            <div key={field.label}>
              <dt className="label-caps">{field.label}</dt>
              <dd className="mt-1 text-sm text-neutral-800">{field.value}</dd>
            </div>
          ))}
        </dl>

        {contact.notes && (
          <div className="mt-4 border-t border-neutral-100 pt-4">
            <p className="label-caps">Observações</p>
            <p className="mt-1 text-sm text-neutral-700">{contact.notes}</p>
          </div>
        )}
      </Card>

      <Card>
        <p className="label-caps mb-3">Tags</p>
        <TagManager
          contactTags={contact.tags ?? []}
          availableTags={allTags}
          onAdd={onAddTag}
          onRemove={onRemoveTag}
          onCreate={onCreateTag}
        />
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <p className="label-caps">Negócios vinculados</p>
        </div>

        {contact.deals && contact.deals.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {contact.deals.map((deal) => (
              <li key={deal.id} className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-neutral-900">{deal.title}</p>
                  <p className="text-xs text-neutral-500">{formatCurrency(deal.value)}</p>
                </div>
                <span className="text-xs font-medium text-neutral-500">{dealStatusLabels[deal.status]}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-500">Nenhum negócio vinculado a este contato ainda.</p>
        )}

        <div className="mt-4 flex gap-3">
          <Button variant="secondary" size="sm" onClick={openDealPicker}>
            Vincular negócio existente
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              navigate(
                `/deals?newForContact=${contact.id}&newForContactName=${encodeURIComponent(contact.name)}`,
              )
            }
          >
            Criar negócio
          </Button>
        </div>
      </Card>

      <Modal open={dealPickerOpen} onClose={() => setDealPickerOpen(false)} title="Vincular negócio existente" size="sm">
        {loadingDeals ? (
          <p className="text-sm text-neutral-500">Carregando negócios…</p>
        ) : availableDeals.length === 0 ? (
          <p className="text-sm text-neutral-500">Não há negócios disponíveis para vincular no momento.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {availableDeals.map((deal) => (
              <li key={deal.id}>
                <button
                  type="button"
                  onClick={() => handleLinkDeal(deal)}
                  className="flex w-full items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-left text-sm hover:border-purple-300 hover:bg-purple-50/60"
                >
                  <span className="font-medium text-neutral-900">{deal.title}</span>
                  <span className="text-xs text-neutral-500">{formatCurrency(deal.value)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        title="Excluir contato"
        message={`Tem certeza que deseja excluir "${contact.name}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  )
}
