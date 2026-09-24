import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { StageBadge } from '@/components/deals/StageBadge'
import { ProposalSection } from '@/components/deals/ProposalSection'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { deleteDeal } from '@/services/supabase/deals'
import { getContacts } from '@/services/supabase/contacts'
import { DEAL_STAGES, formatCurrency, getStageConfig } from '@/utils/deals'
import type { Contact, Deal, DealStage, ProposalGenerationPayload } from '@/types'

interface DealDetailProps {
  deal: Deal
  userName: string
  onUpdate: (data: Partial<Deal>) => Promise<boolean | undefined>
  onEdit: () => void
  uploadProposal: (file: File) => Promise<void>
  uploadingProposal: boolean
  deleteProposal: () => Promise<void>
  generateProposal: (payload: ProposalGenerationPayload) => Promise<string | null>
  generatingProposal: boolean
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR')
}

export function DealDetail({
  deal,
  userName,
  onUpdate,
  onEdit,
  uploadProposal,
  uploadingProposal,
  deleteProposal,
  generateProposal,
  generatingProposal,
}: DealDetailProps) {
  const navigate = useNavigate()
  const [stageMenuOpen, setStageMenuOpen] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [contactPickerOpen, setContactPickerOpen] = useState(false)
  const [availableContacts, setAvailableContacts] = useState<Contact[]>([])
  const [loadingContacts, setLoadingContacts] = useState(false)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (stageRef.current && !stageRef.current.contains(event.target as Node)) {
        setStageMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleStageChange(stage: DealStage) {
    setStageMenuOpen(false)
    if (stage === deal.stage) return
    await onUpdate({
      stage,
      status: stage === 'won' ? 'won' : stage === 'lost' ? 'lost' : 'open',
      probability: getStageConfig(stage).default_probability,
    })
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteDeal(deal.id)
      toast.success('Negócio excluído com sucesso.')
      navigate('/deals', { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível excluir o negócio.')
      setDeleting(false)
    }
  }

  async function openContactPicker() {
    setContactPickerOpen(true)
    setLoadingContacts(true)
    try {
      const result = await getContacts({ pageSize: 100 })
      setAvailableContacts(result.data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível carregar os contatos.')
    } finally {
      setLoadingContacts(false)
    }
  }

  async function handleLinkContact(contact: Contact) {
    const success = await onUpdate({ contact_id: contact.id })
    if (success) setContactPickerOpen(false)
  }

  const infoFields: { label: string; value: string }[] = [
    { label: 'Valor', value: formatCurrency(deal.value) },
    { label: 'Serviço', value: deal.service ?? '—' },
    { label: 'Probabilidade', value: `${deal.probability}%` },
    { label: 'Fechamento previsto', value: formatDate(deal.expected_close_date) },
    { label: 'Origem', value: deal.origin ?? '—' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-medium tracking-tightest text-neutral-900">{deal.title}</h1>
            <div ref={stageRef} className="relative mt-2 inline-block">
              <StageBadge stage={deal.stage} onClick={() => setStageMenuOpen((value) => !value)} />
              {stageMenuOpen && (
                <div className="absolute left-0 top-full z-20 mt-2 w-48 animate-fade-in overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg">
                  {DEAL_STAGES.map((stage) => (
                    <button
                      key={stage.key}
                      type="button"
                      onClick={() => handleStageChange(stage.key)}
                      className="block w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-purple-50"
                    >
                      {stage.label}
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

        {deal.notes && (
          <div className="mt-4 border-t border-neutral-100 pt-4">
            <p className="label-caps">Observações</p>
            <p className="mt-1 text-sm text-neutral-700">{deal.notes}</p>
          </div>
        )}
      </Card>

      <Card>
        <p className="label-caps mb-3">Contato vinculado</p>
        {deal.contact ? (
          <div>
            <p className="text-sm font-medium text-neutral-900">{deal.contact.name}</p>
            <p className="mt-1 text-xs text-neutral-500">{deal.contact.email ?? '—'}</p>
            <p className="text-xs text-neutral-500">{deal.contact.phone ?? '—'}</p>
            <Link
              to={`/crm/${deal.contact.id}`}
              className="mt-3 inline-block text-xs font-medium text-purple-600 hover:text-purple-700"
            >
              Ver no CRM →
            </Link>
          </div>
        ) : (
          <div>
            <p className="text-sm text-neutral-500">Nenhum contato vinculado a este negócio ainda.</p>
            <Button variant="secondary" size="sm" className="mt-3" onClick={openContactPicker}>
              Vincular contato existente
            </Button>
          </div>
        )}
      </Card>

      <ProposalSection
        deal={deal}
        contactName={deal.contact?.name ?? 'Cliente'}
        contactNiche={null}
        userName={userName}
        uploadProposal={uploadProposal}
        uploadingProposal={uploadingProposal}
        deleteProposal={deleteProposal}
        generateProposal={generateProposal}
        generatingProposal={generatingProposal}
      />

      <Modal open={contactPickerOpen} onClose={() => setContactPickerOpen(false)} title="Vincular contato existente" size="sm">
        {loadingContacts ? (
          <p className="text-sm text-neutral-500">Carregando contatos…</p>
        ) : availableContacts.length === 0 ? (
          <p className="text-sm text-neutral-500">Nenhum contato encontrado no CRM.</p>
        ) : (
          <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto">
            {availableContacts.map((contact) => (
              <li key={contact.id}>
                <button
                  type="button"
                  onClick={() => handleLinkContact(contact)}
                  className="flex w-full items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-left text-sm hover:border-purple-300 hover:bg-purple-50/60"
                >
                  <span className="font-medium text-neutral-900">{contact.name}</span>
                  <span className="text-xs text-neutral-500">{contact.email ?? contact.phone ?? ''}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        title="Excluir negócio"
        message={`Tem certeza que deseja excluir "${deal.title}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  )
}
