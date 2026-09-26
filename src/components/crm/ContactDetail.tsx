import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  CalendarDays,
  ChevronDown,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Sparkles,
  Trash2,
  Link2,
  Plus,
  type LucideIcon,
} from 'lucide-react'
import { StatusBadge } from '@/components/crm/StatusBadge'
import { TagManager } from '@/components/crm/TagManager'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { InitialsAvatar } from '@/components/ui/InitialsAvatar'
import { PanelHeader } from '@/components/ui/PanelHeader'
import { StageBadge } from '@/components/deals/StageBadge'
import { CONTACT_STATUS_COLORS } from '@/components/crm/statusColors'
import { siteUrl, whatsappUrl } from '@/utils/contactLinks'
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
  /** Coluna da direita (histórico de interações). */
  history: ReactNode
  /** Cards extras abaixo dos negócios (ex: tarefas vinculadas). */
  extra?: ReactNode
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
  return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
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
  history,
  extra,
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

  const whatsapp = whatsappUrl(contact.phone)
  const location = [contact.city, contact.state].filter(Boolean).join('/')
  const infoFields: { icon: LucideIcon; label: string; value: ReactNode }[] = [
    { icon: Mail, label: 'E-mail', value: contact.email ?? '—' },
    { icon: Phone, label: 'Telefone', value: contact.phone ?? '—' },
    {
      icon: Globe,
      label: 'Site atual',
      value: contact.current_site ? (
        <a
          href={siteUrl(contact.current_site)}
          target="_blank"
          rel="noreferrer"
          className="text-[var(--accent-text)] underline-offset-4 hover:underline"
        >
          {contact.current_site}
        </a>
      ) : (
        'Não tem'
      ),
    },
    { icon: Sparkles, label: 'Origem', value: contact.origin ?? '—' },
    { icon: CalendarDays, label: 'Criado em', value: formatDate(contact.created_at) },
  ]

  const actionButton =
    'inline-flex h-10 items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-card)] px-4 text-[13.5px] font-medium text-[var(--text-primary)] transition hover:border-[var(--accent-ring)]'

  return (
    <div className="flex flex-col gap-6">
      <section className="relative overflow-hidden rounded-[26px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-card)] sm:p-7">
        <div
          className="pointer-events-none absolute -right-24 -top-32 size-80 rounded-full opacity-25 blur-[90px]"
          style={{ backgroundColor: CONTACT_STATUS_COLORS[contact.status] }}
          aria-hidden
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4 sm:gap-5">
            <InitialsAvatar name={contact.name} size="lg" />
            <div className="min-w-0">
              <h1 className="break-words font-display text-[26px] font-bold leading-tight tracking-tight text-[var(--text-primary)] sm:text-[30px]">
                {contact.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-[var(--text-muted)]">
                <div ref={statusRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setStatusMenuOpen((value) => !value)}
                    aria-haspopup="menu"
                    aria-expanded={statusMenuOpen}
                    className="inline-flex items-center gap-1 rounded-full transition hover:brightness-110"
                    title="Mudar status"
                  >
                    <StatusBadge status={contact.status} />
                    <ChevronDown className="size-3.5" />
                  </button>
                  {statusMenuOpen && (
                    <div
                      role="menu"
                      className="absolute left-0 top-full z-20 mt-2 w-48 animate-fade-in overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--panel-bg)] p-1.5 shadow-[var(--shadow-modal)]"
                    >
                      {CONTACT_STATUSES.map((status) => (
                        <button
                          key={status}
                          type="button"
                          role="menuitemradio"
                          aria-checked={status === contact.status}
                          onClick={() => handleStatusChange(status)}
                          className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13.5px] transition-colors hover:bg-[var(--bg-muted)] ${
                            status === contact.status ? 'font-semibold text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                          }`}
                        >
                          <span className="size-2 rounded-full" style={{ backgroundColor: CONTACT_STATUS_COLORS[status] }} />
                          {CONTACT_STATUS_LABELS[status]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {contact.niche && <span>{contact.niche}</span>}
                {location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    {location}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {whatsapp && (
              <a href={whatsapp} target="_blank" rel="noreferrer" className={actionButton}>
                <MessageCircle className="size-4 text-emerald-500" />
                WhatsApp
              </a>
            )}
            {contact.email && (
              <a href={`mailto:${contact.email}`} className={actionButton}>
                <Mail className="size-4 text-[var(--accent-text)]" />
                E-mail
              </a>
            )}
            <button type="button" onClick={onEdit} className={actionButton}>
              <Pencil className="size-4 text-[var(--text-muted)]" />
              Editar
            </button>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              aria-label="Excluir contato"
              title="Excluir contato"
              className="flex size-10 items-center justify-center rounded-full border border-[var(--border-default)] text-[var(--text-muted)] transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-500"
            >
              <Trash2 className="size-4" />
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

            {contact.notes && (
              <div className="mt-5 rounded-2xl border border-[var(--border-subtle)] bg-black/[0.015] p-4 dark:bg-white/[0.025]">
                <p className="text-[12px] font-medium text-[var(--text-muted)]">Observações</p>
                <p className="mt-1 whitespace-pre-line text-[14px] leading-relaxed text-[var(--text-primary)]">{contact.notes}</p>
              </div>
            )}
          </Card>

          <Card>
            <PanelHeader title="Tags" />
            <TagManager
              contactTags={contact.tags ?? []}
              availableTags={allTags}
              onAdd={onAddTag}
              onRemove={onRemoveTag}
              onCreate={onCreateTag}
            />
          </Card>

          <Card>
            <PanelHeader title="Negócios" subtitle="Vinculados a este contato" />
            {contact.deals && contact.deals.length > 0 ? (
              <ul className="-mx-2 flex flex-col gap-1">
                {contact.deals.map((deal) => (
                  <li key={deal.id}>
                    <button
                      type="button"
                      onClick={() => navigate(`/deals/${deal.id}`)}
                      className="flex w-full items-center justify-between gap-3 rounded-2xl px-2 py-2.5 text-left transition-colors hover:bg-[var(--bg-muted)]"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[14px] font-medium text-[var(--text-primary)]">{deal.title}</span>
                        <span className="mt-0.5 block text-[12.5px] tabular-nums text-[var(--text-muted)]">
                          {formatCurrency(deal.value)} · {dealStatusLabels[deal.status]}
                        </span>
                      </span>
                      {deal.stage && <StageBadge stage={deal.stage} />}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13.5px] text-[var(--text-muted)]">Nenhum negócio vinculado a este contato ainda.</p>
            )}

            <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--border-subtle)] pt-4">
              <Button
                size="sm"
                className="h-9 rounded-full px-4"
                onClick={() =>
                  navigate(`/deals?newForContact=${contact.id}&newForContactName=${encodeURIComponent(contact.name)}`)
                }
              >
                <Plus className="size-4" />
                Criar negócio
              </Button>
              <Button variant="secondary" size="sm" className="h-9 rounded-full px-4" onClick={openDealPicker}>
                <Link2 className="size-4" />
                Vincular existente
              </Button>
            </div>
          </Card>

          {extra}
        </div>

        <div className="lg:col-span-3">{history}</div>
      </div>

      <Modal open={dealPickerOpen} onClose={() => setDealPickerOpen(false)} title="Vincular negócio existente" size="sm">
        {loadingDeals ? (
          <p className="text-sm text-[var(--text-muted)]">Carregando negócios…</p>
        ) : availableDeals.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Não há negócios disponíveis para vincular no momento.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {availableDeals.map((deal) => (
              <li key={deal.id}>
                <button
                  type="button"
                  onClick={() => handleLinkDeal(deal)}
                  className="flex w-full items-center justify-between rounded-xl border border-[var(--border-default)] px-3.5 py-2.5 text-left text-sm transition hover:border-[var(--accent-ring)] hover:bg-[var(--accent-tint)]"
                >
                  <span className="font-medium text-[var(--text-primary)]">{deal.title}</span>
                  <span className="text-xs text-[var(--text-muted)]">{formatCurrency(deal.value)}</span>
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
