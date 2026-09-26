import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ArrowUpRight,
  Briefcase,
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  Layers,
  Link2,
  Mail,
  MessageCircle,
  Pencil,
  Sparkles,
  Trash2,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react'
import { StageBadge } from '@/components/deals/StageBadge'
import { ProposalSection } from '@/components/deals/ProposalSection'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { InitialsAvatar } from '@/components/ui/InitialsAvatar'
import { PanelHeader } from '@/components/ui/PanelHeader'
import { whatsappUrl } from '@/utils/contactLinks'
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
  /** Coluna da direita (histórico). */
  history: ReactNode
  /** Cards extras na coluna da esquerda (ex: tarefas). */
  extra?: ReactNode
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

const OPEN_STAGES = DEAL_STAGES.filter((stage) => stage.key !== 'won' && stage.key !== 'lost')

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
  history,
  extra,
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

  const stageConfig = getStageConfig(deal.stage)
  const currentOpenIndex = OPEN_STAGES.findIndex((stage) => stage.key === deal.stage)
  const closed = deal.stage === 'won' || deal.stage === 'lost'
  const whatsapp = whatsappUrl(deal.contact?.phone)

  const infoFields: { icon: LucideIcon; label: string; value: ReactNode }[] = [
    { icon: Wallet, label: 'Valor', value: formatCurrency(deal.value) },
    { icon: Layers, label: 'Serviço', value: deal.service ?? '—' },
    { icon: CalendarDays, label: 'Fechamento previsto', value: formatDate(deal.expected_close_date) },
    { icon: Sparkles, label: 'Origem', value: deal.origin ?? '—' },
    { icon: Clock, label: 'Criado em', value: formatDate(deal.created_at.slice(0, 10)) },
  ]

  const actionButton =
    'inline-flex h-10 items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-card)] px-4 text-[13.5px] font-medium text-[var(--text-primary)] transition hover:border-[var(--accent-ring)]'

  return (
    <div className="flex flex-col gap-6">
      <section className="relative overflow-hidden rounded-[26px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-card)] sm:p-7">
        <div
          className="pointer-events-none absolute -right-24 -top-32 size-80 rounded-full opacity-25 blur-[90px]"
          style={{ backgroundColor: stageConfig.color }}
          aria-hidden
        />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4 sm:gap-5">
            <span
              className="flex size-16 shrink-0 items-center justify-center rounded-[20px]"
              style={{ backgroundColor: `${stageConfig.color}22`, color: stageConfig.color }}
            >
              <Briefcase className="size-7" />
            </span>
            <div className="min-w-0">
              <h1 className="break-words font-display text-[26px] font-bold leading-tight tracking-tight text-[var(--text-primary)] sm:text-[30px]">
                {deal.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-[var(--text-muted)]">
                <div ref={stageRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setStageMenuOpen((value) => !value)}
                    aria-haspopup="menu"
                    aria-expanded={stageMenuOpen}
                    title="Mudar etapa"
                    className="inline-flex items-center gap-1 rounded-full transition hover:brightness-110"
                  >
                    <StageBadge stage={deal.stage} />
                    <ChevronDown className="size-3.5" />
                  </button>
                  {stageMenuOpen && (
                    <div
                      role="menu"
                      className="absolute left-0 top-full z-20 mt-2 w-52 animate-fade-in overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--panel-bg)] p-1.5 shadow-[var(--shadow-modal)]"
                    >
                      {DEAL_STAGES.map((stage) => (
                        <button
                          key={stage.key}
                          type="button"
                          role="menuitemradio"
                          aria-checked={stage.key === deal.stage}
                          onClick={() => handleStageChange(stage.key)}
                          className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13.5px] transition-colors hover:bg-[var(--bg-muted)] ${
                            stage.key === deal.stage ? 'font-semibold text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                          }`}
                        >
                          <span className="size-2 rounded-full" style={{ backgroundColor: stage.color }} />
                          {stage.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {deal.service && <span>{deal.service}</span>}
                {deal.contact && (
                  <Link to={`/crm/${deal.contact.id}`} className="inline-flex items-center gap-1 hover:text-[var(--accent-text)]">
                    {deal.contact.name}
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-4 lg:items-end">
            <div className="lg:text-right">
              <p className="font-display text-[30px] font-bold leading-none tracking-tight tabular-nums text-[var(--text-primary)]">
                {formatCurrency(deal.value)}
              </p>
              <p className="mt-1.5 text-[12.5px] text-[var(--text-muted)]">
                {deal.probability}% de chance de fechar
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={onEdit} className={actionButton}>
                <Pencil className="size-4 text-[var(--text-muted)]" />
                Editar
              </button>
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                aria-label="Excluir negócio"
                title="Excluir negócio"
                className="flex size-10 items-center justify-center rounded-full border border-[var(--border-default)] text-[var(--text-muted)] transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-500"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Etapas do funil: clique numa etapa para mover o negócio. */}
        <div className="relative mt-7 flex flex-col gap-3 border-t border-[var(--border-subtle)] pt-5 xl:flex-row xl:items-center">
          <ol className="grid flex-1 grid-cols-5 gap-1.5" aria-label="Etapa do negócio">
            {OPEN_STAGES.map((stage, index) => {
              const reached = !closed && index <= currentOpenIndex
              const current = stage.key === deal.stage
              return (
                <li key={stage.key}>
                  <button
                    type="button"
                    onClick={() => handleStageChange(stage.key)}
                    aria-current={current ? 'step' : undefined}
                    title={`Mover para ${stage.label}`}
                    className="group flex w-full flex-col gap-1.5 text-left"
                  >
                    <span
                      className="h-1.5 w-full rounded-full transition-all group-hover:opacity-80"
                      style={{
                        background: reached ? stage.color : 'var(--bg-muted)',
                        boxShadow: current ? `0 0 12px ${stage.color}` : undefined,
                      }}
                    />
                    <span
                      className={`hidden truncate text-[12px] sm:block ${current ? 'font-semibold text-[var(--text-primary)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]'}`}
                    >
                      {stage.label}
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
          <div className="flex gap-2 xl:pl-3">
            <button
              type="button"
              onClick={() => handleStageChange('won')}
              aria-pressed={deal.stage === 'won'}
              className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition ${
                deal.stage === 'won'
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:border-emerald-500/40 hover:text-emerald-600 dark:hover:text-emerald-400'
              }`}
            >
              <Check className="size-4" />
              Ganho
            </button>
            <button
              type="button"
              onClick={() => handleStageChange('lost')}
              aria-pressed={deal.stage === 'lost'}
              className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition ${
                deal.stage === 'lost'
                  ? 'border-red-500/40 bg-red-500/15 text-red-600 dark:text-red-400'
                  : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:border-red-500/40 hover:text-red-600 dark:hover:text-red-400'
              }`}
            >
              <X className="size-4" />
              Perdido
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <PanelHeader title="Informações" />
            <dl className="flex flex-col gap-4">
              {infoFields.map((field) => (
                <div key={field.label} className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-muted)] text-[var(--text-muted)]">
                    <field.icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <dt className="text-[12px] text-[var(--text-muted)]">{field.label}</dt>
                    <dd className="mt-0.5 break-words text-[14px] text-[var(--text-primary)]">{field.value}</dd>
                  </div>
                </div>
              ))}
            </dl>

            {deal.notes && (
              <div className="mt-5 rounded-2xl border border-[var(--border-subtle)] bg-black/[0.015] p-4 dark:bg-white/[0.025]">
                <p className="text-[12px] font-medium text-[var(--text-muted)]">Observações</p>
                <p className="mt-1 whitespace-pre-line text-[14px] leading-relaxed text-[var(--text-primary)]">{deal.notes}</p>
              </div>
            )}
          </Card>

          <Card>
            <PanelHeader title="Contato" />
            {deal.contact ? (
              <div>
                <Link to={`/crm/${deal.contact.id}`} className="group flex items-center gap-3">
                  <InitialsAvatar name={deal.contact.name} />
                  <span className="min-w-0">
                    <span className="block truncate text-[14.5px] font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-text)]">
                      {deal.contact.name}
                    </span>
                    <span className="block truncate text-[12.5px] text-[var(--text-muted)]">
                      {[deal.contact.email, deal.contact.phone].filter(Boolean).join(' · ') || 'Sem e-mail ou telefone'}
                    </span>
                  </span>
                </Link>
                <div className="mt-4 flex flex-wrap gap-2">
                  {whatsapp && (
                    <a href={whatsapp} target="_blank" rel="noreferrer" className={`${actionButton} h-9`}>
                      <MessageCircle className="size-4 text-emerald-500" />
                      WhatsApp
                    </a>
                  )}
                  {deal.contact.email && (
                    <a href={`mailto:${deal.contact.email}`} className={`${actionButton} h-9`}>
                      <Mail className="size-4 text-[var(--accent-text)]" />
                      E-mail
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-[13.5px] text-[var(--text-muted)]">Nenhum contato vinculado a este negócio ainda.</p>
                <Button variant="secondary" size="sm" className="mt-4 h-9 rounded-full px-4" onClick={openContactPicker}>
                  <Link2 className="size-4" />
                  Vincular contato
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

          {extra}
        </div>

        <div className="lg:col-span-3">{history}</div>
      </div>

      <Modal open={contactPickerOpen} onClose={() => setContactPickerOpen(false)} title="Vincular contato existente" size="sm">
        {loadingContacts ? (
          <p className="text-sm text-[var(--text-muted)]">Carregando contatos…</p>
        ) : availableContacts.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Nenhum contato encontrado no CRM.</p>
        ) : (
          <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto">
            {availableContacts.map((contact) => (
              <li key={contact.id}>
                <button
                  type="button"
                  onClick={() => handleLinkContact(contact)}
                  className="flex w-full items-center justify-between rounded-xl border border-[var(--border-default)] px-3.5 py-2.5 text-left text-sm transition hover:border-[var(--accent-ring)] hover:bg-[var(--accent-tint)]"
                >
                  <span className="font-medium text-[var(--text-primary)]">{contact.name}</span>
                  <span className="text-xs text-[var(--text-muted)]">{contact.email ?? contact.phone ?? ''}</span>
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
