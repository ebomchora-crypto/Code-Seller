import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Check, Copy, ExternalLink, Eye, Link2, MessageCircle, Plus, Star, Trash2, X } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { cancelOnlineProposal, createOnlineProposal, getOnlineProposals } from '@/services/supabase/onlineProposals'
import { KIT_PROPOSALS } from '@/data/academy'
import { formatCurrency } from '@/utils/deals'
import { whatsappUrl } from '@/utils/contactLinks'
import {
  MAX_PROPOSAL_OPTIONS,
  ONLINE_PROPOSAL_STATUS,
  defaultOptions,
  isProposalOpen,
  kitBodyForOnline,
  newOptionId,
  parsePrice,
  proposalLink,
  proposalWhatsappMessage,
  validUntilFromDays,
  validateProposalDraft,
} from '@/utils/onlineProposal'
import type { Deal, OnlineProposal, ProposalOption } from '@/types'
import { currencyOf, currencySymbol } from '@/utils/currency'

interface OnlineProposalModalProps {
  open: boolean
  onClose: () => void
  deal: Deal
  onChanged?: () => void
}

const TONE_CLASSES = {
  muted: 'bg-[var(--bg-muted)] text-[var(--text-secondary)]',
  info: 'bg-sky-500/12 text-sky-600 dark:text-sky-300',
  success: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300',
  danger: 'bg-rose-500/12 text-rose-600 dark:text-rose-300',
}

const VALIDITY_OPTIONS = [
  { value: '7', label: '7 dias' },
  { value: '15', label: '15 dias' },
  { value: '30', label: '30 dias' },
  { value: '0', label: 'Sem validade' },
]

const DEFAULT_PAYMENT = '50% na aprovação e 50% na entrega, via Pix.'

function formatDate(value: string, withTime = false): string {
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value)
  return date.toLocaleString('pt-BR', withTime ? { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' } : { day: '2-digit', month: 'short', year: 'numeric' })
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('Link copiado')
  } catch {
    toast.error('Não foi possível copiar. Selecione o link e copie manualmente.')
  }
}

function ShareActions({ proposal, phone }: { proposal: OnlineProposal; phone: string | null | undefined }) {
  const link = proposalLink(proposal.token)
  const wa = whatsappUrl(phone)
  const waHref = `${wa ?? 'https://wa.me/'}?text=${encodeURIComponent(proposalWhatsappMessage(link))}`
  const buttonClass =
    'inline-flex h-9 items-center gap-2 rounded-full border border-[var(--border-default)] px-3.5 text-[13px] font-medium text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--bg-muted)]'
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => void copyText(link)} className={buttonClass}>
        <Copy className="size-4 text-[var(--accent-text)]" />
        Copiar link
      </button>
      <a href={waHref} target="_blank" rel="noreferrer" className={buttonClass}>
        <MessageCircle className="size-4 text-emerald-500" />
        Enviar no WhatsApp
      </a>
      <a href={`${link}?preview=1`} target="_blank" rel="noreferrer" className={buttonClass}>
        <ExternalLink className="size-4 text-[var(--text-muted)]" />
        Ver como o cliente
      </a>
    </div>
  )
}

function ProposalRow({ proposal, phone, onCancel }: { proposal: OnlineProposal; phone: string | null | undefined; onCancel: () => void }) {
  const status = ONLINE_PROPOSAL_STATUS[proposal.status]
  const open = isProposalOpen(proposal)
  return (
    <li className="rounded-2xl border border-[var(--border-default)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-[var(--text-primary)]">{proposal.title}</p>
          <p className="mt-0.5 text-[12.5px] text-[var(--text-muted)]">
            Criada em {formatDate(proposal.created_at)}
            {proposal.valid_until && ` · válida até ${formatDate(proposal.valid_until)}`}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${TONE_CLASSES[status.tone]}`}>{status.label}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-[var(--text-secondary)]">
        <span className="flex items-center gap-1.5">
          <Eye className="size-3.5 text-[var(--text-muted)]" />
          {proposal.views === 0
            ? 'Ainda não foi aberta'
            : `Aberta ${proposal.views}x${proposal.last_viewed_at ? ` · última em ${formatDate(proposal.last_viewed_at, true)}` : ''}`}
        </span>
      </div>

      {proposal.status === 'approved' && (
        <p className="mt-3 rounded-xl bg-emerald-500/[0.08] px-3.5 py-2.5 text-[13.5px] text-[var(--text-primary)]">
          <strong>{proposal.responder_name}</strong> aprovou <strong>{proposal.chosen_option_name}</strong>
          {proposal.chosen_price !== null && ` (${formatCurrency(proposal.chosen_price, proposal.currency)})`}
          {proposal.responded_at && ` em ${formatDate(proposal.responded_at, true)}`}.
          {proposal.response_note && <span className="mt-1 block text-[var(--text-secondary)]">“{proposal.response_note}”</span>}
        </p>
      )}
      {proposal.status === 'declined' && (
        <p className="mt-3 rounded-xl bg-rose-500/[0.07] px-3.5 py-2.5 text-[13.5px] text-[var(--text-primary)]">
          {proposal.responder_name ?? 'O cliente'} recusou a proposta.
          {proposal.response_note && <span className="mt-1 block text-[var(--text-secondary)]">Motivo: “{proposal.response_note}”</span>}
        </p>
      )}

      {proposal.status !== 'cancelled' && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <ShareActions proposal={proposal} phone={phone} />
          {open && (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-[var(--text-muted)] transition hover:bg-rose-500/10 hover:text-rose-500"
            >
              <X className="size-4" />
              Cancelar link
            </button>
          )}
        </div>
      )}
    </li>
  )
}

function OptionEditor({
  currency,
  option,
  index,
  canRemove,
  onChange,
  onRemove,
  onRecommend,
}: {
  currency?: string
  option: ProposalOption
  index: number
  canRemove: boolean
  onChange: (option: ProposalOption) => void
  onRemove: () => void
  onRecommend: () => void
}) {
  const [priceText, setPriceText] = useState(option.price !== null ? String(option.price).replace('.', ',') : '')
  return (
    <div className="rounded-2xl border border-[var(--border-default)] p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">Opção {index + 1}</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onRecommend}
            aria-pressed={option.recommended}
            className={`inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium transition ${
              option.recommended ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300' : 'text-[var(--text-muted)] hover:bg-[var(--bg-muted)]'
            }`}
          >
            <Star className={`size-3.5 ${option.recommended ? 'fill-current' : ''}`} />
            Recomendada
          </button>
          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remover opção ${index + 1}`}
              className="flex size-8 items-center justify-center rounded-full text-[var(--text-muted)] transition hover:bg-rose-500/10 hover:text-rose-500"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_160px]">
        <Input label="Nome" value={option.name} maxLength={60} onChange={(event) => onChange({ ...option, name: event.target.value })} />
        <Input
          label={`Valor (${currencySymbol(currencyOf(currency))})`}
          inputMode="decimal"
          placeholder="0,00"
          value={priceText}
          onChange={(event) => {
            setPriceText(event.target.value)
            onChange({ ...option, price: parsePrice(event.target.value) })
          }}
        />
      </div>
      <div className="mt-3">
        <Textarea
          label="O que inclui"
          rows={3}
          maxLength={600}
          placeholder="Um item por linha"
          value={option.description}
          onChange={(event) => onChange({ ...option, description: event.target.value })}
        />
      </div>
    </div>
  )
}

function Section({ title, children, hint }: { title: string; children: ReactNode; hint?: string }) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">{title}</h3>
        {hint && <p className="text-[12.5px] text-[var(--text-muted)]">{hint}</p>}
      </div>
      {children}
    </section>
  )
}

// Proposta online do negócio: cria o link público, acompanha se o cliente
// abriu e mostra a resposta (aprovada/recusada).
export function OnlineProposalModal({ open, onClose, deal, onChanged }: OnlineProposalModalProps) {
  const [proposals, setProposals] = useState<OnlineProposal[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'create' | 'created'>('list')
  const [created, setCreated] = useState<OnlineProposal | null>(null)
  const [cancelTarget, setCancelTarget] = useState<OnlineProposal | null>(null)
  const [saving, setSaving] = useState(false)

  const [title, setTitle] = useState(`Proposta — ${deal.title}`)
  const [clientName, setClientName] = useState(deal.contact?.name ?? '')
  const [body, setBody] = useState('')
  const [options, setOptions] = useState<ProposalOption[]>(() => defaultOptions(deal.value))
  const [payment, setPayment] = useState(DEFAULT_PAYMENT)
  const [validity, setValidity] = useState('15')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = await getOnlineProposals(deal.id)
      setProposals(list)
      setView((current) => (current === 'created' ? current : list.length === 0 ? 'create' : 'list'))
    } catch {
      toast.error('Não foi possível carregar as propostas online.')
    } finally {
      setLoading(false)
    }
  }, [deal.id])

  useEffect(() => {
    if (open) void load()
  }, [open, load])

  function applyKitModel(id: string) {
    const model = KIT_PROPOSALS.find((item) => item.id === id)
    if (model) setBody(kitBodyForOnline(model.body))
  }

  async function handleCreate() {
    const draft = { title, options }
    const problem = validateProposalDraft(draft)
    if (problem) {
      toast.error(problem)
      return
    }
    setSaving(true)
    try {
      const proposal = await createOnlineProposal({
        deal_id: deal.id,
        title: title.trim(),
        client_name: clientName.trim() || null,
        body: body.trim(),
        options: options.map((option) => ({ ...option, name: option.name.trim(), description: option.description.trim() })),
        payment_terms: payment.trim() || null,
        valid_until: validUntilFromDays(Number(validity) || null),
      })
      setCreated(proposal)
      setProposals((current) => [proposal, ...current])
      setView('created')
      onChanged?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível criar a proposta.')
    } finally {
      setSaving(false)
    }
  }

  async function handleCancel() {
    if (!cancelTarget) return
    try {
      await cancelOnlineProposal(cancelTarget.id)
      setProposals((current) => current.map((item) => (item.id === cancelTarget.id ? { ...item, status: 'cancelled' } : item)))
      toast.success('Link cancelado. O cliente não consegue mais abrir esta proposta.')
    } catch {
      toast.error('Não foi possível cancelar o link.')
    } finally {
      setCancelTarget(null)
    }
  }

  function updateOption(index: number, option: ProposalOption) {
    setOptions((current) => current.map((item, i) => (i === index ? option : item)))
  }

  const modalTitle = view === 'create' ? 'Nova proposta online' : view === 'created' ? 'Proposta pronta para enviar' : 'Propostas online'

  return (
    <Modal open={open} onClose={onClose} title={modalTitle} size="lg">
      <div data-lenis-prevent className="-mr-2 max-h-[72vh] overflow-y-auto pr-2">
        {loading && view !== 'created' ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
          </div>
        ) : view === 'created' && created ? (
          <div className="flex flex-col gap-5">
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.08] p-4">
              <Check className="mt-0.5 size-5 shrink-0 text-emerald-500" />
              <p className="text-[14px] text-[var(--text-primary)]">
                Link criado. Quando o cliente abrir, você vê aqui e no histórico do negócio. Se ele aprovar, o negócio vira <strong>Ganho</strong>{' '}
                com o valor escolhido e aparece uma tarefa com lembrete para o próximo passo.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-muted)] px-3.5 py-3">
              <Link2 className="size-4 shrink-0 text-[var(--text-muted)]" />
              <span className="truncate text-[13.5px] text-[var(--text-primary)]">{proposalLink(created.token)}</span>
            </div>
            <ShareActions proposal={created} phone={deal.contact?.phone} />
            <div className="border-t border-[var(--border-subtle)] pt-4">
              <Button variant="secondary" className="rounded-full" onClick={() => setView('list')}>
                Ver todas as propostas deste negócio
              </Button>
            </div>
          </div>
        ) : view === 'list' ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13.5px] text-[var(--text-muted)]">O cliente abre o link, escolhe uma opção e aprova, sem precisar de cadastro.</p>
              <Button size="sm" className="shrink-0 rounded-full" onClick={() => setView('create')}>
                <Plus className="size-4" />
                Nova
              </Button>
            </div>
            <ul className="flex flex-col gap-3">
              {proposals.map((proposal) => (
                <ProposalRow key={proposal.id} proposal={proposal} phone={deal.contact?.phone} onCancel={() => setCancelTarget(proposal)} />
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <Section title="Apresentação">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Título" value={title} maxLength={160} onChange={(event) => setTitle(event.target.value)} />
                <Input label="Para (cliente)" value={clientName} maxLength={160} onChange={(event) => setClientName(event.target.value)} />
              </div>
              <Select label="Começar com o texto de um modelo do Kit" defaultValue="" onChange={(event) => applyKitModel(event.target.value)}>
                <option value="">Escrever do zero</option>
                {KIT_PROPOSALS.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.title}
                  </option>
                ))}
              </Select>
              <Textarea
                label="Texto da proposta"
                rows={8}
                maxLength={20000}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="O que você entendeu do negócio, a solução, o que está incluído e o prazo."
                helperText="Aceita títulos com ## e listas com -. Os valores ficam nas opções abaixo."
              />
            </Section>

            <Section title="Opções" hint="O cliente escolhe uma delas para aprovar. Até 3 opções.">
              <div className="flex flex-col gap-3">
                {options.map((option, index) => (
                  <OptionEditor
                    currency={deal.currency}
                    key={option.id}
                    option={option}
                    index={index}
                    canRemove={options.length > 1}
                    onChange={(next) => updateOption(index, next)}
                    onRemove={() => setOptions((current) => current.filter((_, i) => i !== index))}
                    onRecommend={() =>
                      setOptions((current) => current.map((item, i) => ({ ...item, recommended: i === index ? !item.recommended : false })))
                    }
                  />
                ))}
              </div>
              {options.length < MAX_PROPOSAL_OPTIONS && (
                <button
                  type="button"
                  onClick={() => setOptions((current) => [...current, { id: newOptionId(), name: '', description: '', price: null, recommended: false }])}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--border-strong)] text-[13.5px] font-medium text-[var(--text-secondary)] transition hover:border-[var(--accent-ring)] hover:text-[var(--text-primary)]"
                >
                  <Plus className="size-4" />
                  Adicionar opção
                </button>
              )}
            </Section>

            <Section title="Condições">
              <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
                <Input label="Forma de pagamento" value={payment} maxLength={500} onChange={(event) => setPayment(event.target.value)} />
                <Select label="Validade" value={validity} onChange={(event) => setValidity(event.target.value)}>
                  {VALIDITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
            </Section>

            <div className="flex flex-col-reverse gap-2 border-t border-[var(--border-subtle)] pt-5 sm:flex-row sm:justify-end">
              {proposals.length > 0 && (
                <Button variant="secondary" className="rounded-full" onClick={() => setView('list')}>
                  Voltar
                </Button>
              )}
              <Button className="rounded-full" loading={saving} onClick={() => void handleCreate()}>
                <Link2 className="size-4" />
                Criar link da proposta
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={cancelTarget !== null}
        onCancel={() => setCancelTarget(null)}
        onConfirm={() => void handleCancel()}
        danger
        title="Cancelar este link?"
        message="O cliente não vai mais conseguir abrir nem aprovar esta proposta."
        confirmLabel="Cancelar link"
      />
    </Modal>
  )
}
