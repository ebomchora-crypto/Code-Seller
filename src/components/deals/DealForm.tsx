import { useEffect, useRef, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { ChoiceField } from '@/components/ui/ChoiceField'
import { getContactById, getContacts } from '@/services/supabase/contacts'
import { createDeal, updateDeal } from '@/services/supabase/deals'
import { PAYMENT_METHOD_LABELS } from '@/utils/financial'
import { DEAL_STAGES, getStageConfig } from '@/utils/deals'
import { ORIGIN_SUGGESTIONS, SERVICE_SUGGESTIONS, type Contact, type Deal, type DealStage, type PaymentMethod } from '@/types'
import { startFollowUp } from '@/services/supabase/followup'
import { dayToTimestamp, localDay } from '@/utils/saleDate'

interface DealFormProps {
  deal?: Deal
  defaultContactId?: string
  defaultContactName?: string
  onSuccess: (deal: Deal) => void
  onCancel: () => void
}

interface FormState {
  title: string
  contactId: string | null
  contactName: string
  value: string
  stage: DealStage
  probability: number
  service: string
  expectedCloseDate: string
  // Dia da venda (só para Ganho) — é o dia que conta no faturamento.
  wonDate: string
  origin: string
  notes: string
}

// Dia da venda sugerido: o que já está salvo; senão a data de fechamento,
// se já passou; senão hoje.
function initialWonDate(deal?: Deal): string {
  const today = localDay(new Date())
  if (deal?.won_at) return localDay(deal.won_at)
  if (deal?.expected_close_date && deal.expected_close_date <= today) return deal.expected_close_date
  return today
}

function buildInitialState(deal?: Deal, defaultContactId?: string, defaultContactName?: string): FormState {
  return {
    title: deal?.title ?? '',
    contactId: deal?.contact_id ?? defaultContactId ?? null,
    contactName: deal?.contact?.name ?? defaultContactName ?? '',
    value: deal?.value != null ? String(deal.value) : '',
    stage: deal?.stage ?? 'contact',
    probability: deal?.probability ?? getStageConfig('contact').default_probability,
    service: deal?.service ?? '',
    expectedCloseDate: deal?.expected_close_date ?? '',
    wonDate: initialWonDate(deal),
    origin: deal?.origin ?? '',
    notes: deal?.notes ?? '',
  }
}

export function DealForm({ deal, defaultContactId, defaultContactName, onSuccess, onCancel }: DealFormProps) {
  const [form, setForm] = useState<FormState>(buildInitialState(deal, defaultContactId, defaultContactName))
  const [errors, setErrors] = useState<Partial<Record<'title' | 'value' | 'wonDate', string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const today = localDay(new Date())
  // Virando Ganho agora: já recebeu ou ainda vai receber? (vai para o Financeiro)
  const [received, setReceived] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix')

  const [contactOptions, setContactOptions] = useState<Contact[]>([])
  const [contactDropdownOpen, setContactDropdownOpen] = useState(false)
  const contactBoxRef = useRef<HTMLDivElement>(null)

  // Busca no CRM enquanto digita (não só os 100 mais recentes).
  const searchTerm = form.contactId ? '' : form.contactName.trim()
  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(() => {
      getContacts({ pageSize: 30, filters: { search: searchTerm } })
        .then((result) => !cancelled && setContactOptions(result.data))
        .catch(() => !cancelled && setContactOptions([]))
    }, searchTerm ? 250 : 0)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [searchTerm])

  // Contato escolhido: a origem vem dele — não pergunta de novo.
  const [linkedContact, setLinkedContact] = useState<Pick<Contact, 'id' | 'origin' | 'niche'> | null>(null)
  useEffect(() => {
    if (!form.contactId) {
      setLinkedContact(null)
      return
    }
    const known = contactOptions.find((contact) => contact.id === form.contactId)
    if (known) {
      setLinkedContact(known)
      return
    }
    let cancelled = false
    void getContactById(form.contactId)
      .then((contact) => !cancelled && setLinkedContact(contact))
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
    // contactOptions muda a cada busca; só importa quando troca o contato.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.contactId])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (contactBoxRef.current && !contactBoxRef.current.contains(event.target as Node)) {
        setContactDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function handleStageChange(stage: DealStage) {
    setForm((current) => ({
      ...current,
      stage,
      probability: getStageConfig(stage).default_probability,
      // Virando Ganho agora: se a data de fechamento já passou, a venda foi nela.
      wonDate:
        stage === 'won' && current.stage !== 'won' && !deal?.won_at && current.expectedCloseDate && current.expectedCloseDate <= today
          ? current.expectedCloseDate
          : current.wonDate,
    }))
  }

  function selectContact(contact: Contact | null) {
    setForm((current) => ({
      ...current,
      contactId: contact?.id ?? null,
      contactName: contact?.name ?? '',
    }))
    setContactDropdownOpen(false)
  }

  const filteredContacts = contactOptions
  // Só pergunta do pagamento quando o negócio vira Ganho agora e tem valor.
  const becomingWon = form.stage === 'won' && deal?.status !== 'won' && Number(form.value) > 0
  const autoTitle = [form.service.trim(), form.contactName.trim()].filter(Boolean).join(' — ')

  function validate(): boolean {
    const nextErrors: Partial<Record<'title' | 'value' | 'wonDate', string>> = {}

    if (!form.title.trim() && !autoTitle) {
      nextErrors.title = 'Dê um nome ao negócio (ou escolha o contato e o serviço).'
    }
    if (form.value) {
      const numeric = Number(form.value)
      if (Number.isNaN(numeric) || numeric < 0) {
        nextErrors.value = 'Informe um valor numérico positivo.'
      }
    }

    if (form.stage === 'won') {
      if (!form.wonDate) nextErrors.wonDate = 'Informe o dia da venda.'
      else if (form.wonDate > today) nextErrors.wonDate = 'A venda não pode estar no futuro.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      const payload = {
        title: form.title.trim() || autoTitle,
        contact_id: form.contactId,
        value: form.value ? Number(form.value) : null,
        stage: form.stage,
        status: (form.stage === 'won' ? 'won' : form.stage === 'lost' ? 'lost' : 'open') as Deal['status'],
        probability: form.probability,
        service: form.service.trim() || null,
        expected_close_date: form.expectedCloseDate || null,
        // Com contato: a origem é a dele (se ele tiver uma).
        origin: (form.contactId ? linkedContact?.origin : null) || form.origin.trim() || null,
        notes: form.notes.trim() || null,
        proposal_url: deal?.proposal_url ?? null,
        // Mesmo dia já salvo: mantém o horário original.
        ...(form.stage === 'won'
          ? {
              won_at:
                deal?.won_at && localDay(deal.won_at) === form.wonDate ? deal.won_at : dayToTimestamp(form.wonDate),
            }
          : {}),
      }

      const payment = becomingWon ? { received, method: paymentMethod } : undefined
      const result = deal ? await updateDeal(deal.id, payload, payment) : await createDeal(payload, payment)
      let scheduled = 0
      if (!deal && payload.status === 'open' && payload.contact_id) {
        // Negócio novo com contato: agenda o follow-up automático (se ligado).
        scheduled = await startFollowUp({
          contact: { id: payload.contact_id, name: form.contactName || payload.title },
          deal: { id: result.id, title: result.title, value: result.value },
        }).catch(() => 0)
      }
      toast.success(
        becomingWon
          ? received
            ? 'Venda registrada. O valor entrou no Financeiro como recebido.'
            : 'Venda registrada. O valor foi para o Financeiro em "A receber".'
          : deal
            ? 'Negócio atualizado com sucesso.'
            : scheduled > 0
              ? 'Negócio criado. Follow-up agendado nas Tarefas.'
              : 'Negócio criado com sucesso.',
      )
      onSuccess(result)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível salvar o negócio.')
    } finally {
      setSubmitting(false)
    }
  }

  const inheritedOrigin = form.contactId ? linkedContact?.origin ?? null : null

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div ref={contactBoxRef} className="relative flex flex-col gap-1.5">
        <label htmlFor="deal-contact" className="text-[13px] font-medium text-[var(--text-secondary)]">
          Contato do CRM
        </label>
        <Input
          id="deal-contact"
          placeholder="Busque pelo nome, telefone ou e-mail"
          autoComplete="off"
          value={form.contactName}
          onChange={(event) => {
            updateField('contactName', event.target.value)
            updateField('contactId', null)
            setContactDropdownOpen(true)
          }}
          onFocus={() => setContactDropdownOpen(true)}
        />
        {contactDropdownOpen && (
          <div className="absolute left-0 top-full z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-[var(--border-default)] bg-[var(--panel-bg)] p-1 shadow-[var(--shadow-modal)]">
            <button
              type="button"
              onClick={() => selectContact(null)}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--text-muted)] hover:bg-[var(--bg-muted)]"
            >
              Sem contato
            </button>
            {filteredContacts.map((contact) => (
              <button
                key={contact.id}
                type="button"
                onClick={() => selectContact(contact)}
                className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--bg-muted)]"
              >
                <span className="truncate">{contact.name}</span>
                {contact.niche && <span className="shrink-0 text-[12px] text-[var(--text-muted)]">{contact.niche}</span>}
              </button>
            ))}
            {filteredContacts.length === 0 && (
              <p className="px-3 py-2 text-sm text-[var(--text-muted)]">Nenhum contato encontrado.</p>
            )}
          </div>
        )}
        {form.contactId && (
          <p className="text-[12px] text-[var(--text-muted)]">
            {inheritedOrigin ? (
              <>
                Origem: <span className="font-medium text-[var(--text-secondary)]">{inheritedOrigin}</span> (vem do contato)
              </>
            ) : (
              'A origem vem do contato.'
            )}
          </p>
        )}
      </div>

      <ChoiceField
        label="Serviço"
        placeholder="Escolha abaixo ou digite outro"
        value={form.service}
        onChange={(value) => updateField('service', value)}
        options={SERVICE_SUGGESTIONS}
        visible={6}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Valor (R$)"
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          value={form.value}
          onChange={(event) => updateField('value', event.target.value)}
          error={errors.value}
        />
        <Select label="Etapa" required value={form.stage} onChange={(event) => handleStageChange(event.target.value as DealStage)}>
          {DEAL_STAGES.map((stage) => (
            <option key={stage.key} value={stage.key}>
              {stage.label}
            </option>
          ))}
        </Select>
      </div>

      {form.stage === 'won' ? (
        <Input
          label="Data da venda"
          type="date"
          required
          max={today}
          value={form.wonDate}
          onChange={(event) => updateField('wonDate', event.target.value)}
          error={errors.wonDate}
          helperText="A venda entra no faturamento deste dia, não no dia em que foi cadastrada."
        />
      ) : (
        <Input
          label="Previsão de fechamento"
          type="date"
          value={form.expectedCloseDate}
          onChange={(event) => updateField('expectedCloseDate', event.target.value)}
        />
      )}

      {becomingWon && (
        <div className="flex flex-col gap-2 rounded-2xl border border-[var(--border-default)] p-3.5">
          <p className="text-[13px] font-medium text-[var(--text-secondary)]">Você já recebeu esse dinheiro?</p>
          <div role="radiogroup" aria-label="Pagamento" className="grid grid-cols-2 gap-1.5">
            {[
              { value: false, label: 'Ainda vou receber' },
              { value: true, label: 'Já recebi' },
            ].map((option) => (
              <button
                key={option.label}
                type="button"
                role="radio"
                aria-checked={received === option.value}
                onClick={() => setReceived(option.value)}
                className={`h-10 rounded-xl border text-[13px] font-medium transition-colors ${
                  received === option.value
                    ? 'border-[var(--accent-ring)] bg-[var(--accent-tint)] text-[var(--text-primary)]'
                    : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {received && (
            <Select label="Como recebeu" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}>
              {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          )}
          <p className="text-[12px] leading-snug text-[var(--text-muted)]">
            {received
              ? 'Entra no Financeiro como recebido no dia da venda.'
              : 'Vai para o Financeiro em "A receber". Quando o cliente pagar, é só marcar como recebido lá.'}
          </p>
        </div>
      )}

      <Input
        label="Nome do negócio"
        placeholder={autoTitle || 'Ex.: Site institucional'}
        value={form.title}
        onChange={(event) => updateField('title', event.target.value)}
        error={errors.title}
        helperText={!form.title.trim() && autoTitle ? 'Em branco, fica com o nome sugerido.' : undefined}
      />

      {!form.contactId && (
        <ChoiceField
          label="Origem"
          placeholder="Escolha abaixo ou digite outra"
          value={form.origin}
          onChange={(value) => updateField('origin', value)}
          options={ORIGIN_SUGGESTIONS}
          visible={8}
        />
      )}

      <details className="group rounded-2xl border border-[var(--border-default)] px-4 py-3" open={Boolean(deal?.notes)}>
        <summary className="cursor-pointer text-[13.5px] font-medium text-[var(--text-primary)]">
          Mais detalhes <span className="font-normal text-[var(--text-muted)]">(chance de fechar e observações)</span>
        </summary>
        <div className="mt-4 flex flex-col gap-4">
          <Input
            label={`Chance de fechar (${form.probability}%)`}
            type="range"
            min={0}
            max={100}
            value={form.probability}
            onChange={(event) => updateField('probability', Number(event.target.value))}
            helperText="Muda sozinha com a etapa. Ajuste só se quiser."
          />
          <Textarea label="Observações" value={form.notes} onChange={(event) => updateField('notes', event.target.value)} />
        </div>
      </details>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {deal ? 'Salvar alterações' : 'Criar negócio'}
        </Button>
      </div>
    </form>
  )
}
