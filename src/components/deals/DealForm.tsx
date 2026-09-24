import { useEffect, useRef, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { getContacts } from '@/services/supabase/contacts'
import { createDeal, updateDeal } from '@/services/supabase/deals'
import { DEAL_STAGES, getStageConfig } from '@/utils/deals'
import { ORIGIN_SUGGESTIONS, SERVICE_SUGGESTIONS, type Contact, type Deal, type DealStage } from '@/types'

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
  origin: string
  notes: string
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
    origin: deal?.origin ?? '',
    notes: deal?.notes ?? '',
  }
}

export function DealForm({ deal, defaultContactId, defaultContactName, onSuccess, onCancel }: DealFormProps) {
  const [form, setForm] = useState<FormState>(buildInitialState(deal, defaultContactId, defaultContactName))
  const [errors, setErrors] = useState<Partial<Record<'title' | 'value', string>>>({})
  const [submitting, setSubmitting] = useState(false)

  const [contactOptions, setContactOptions] = useState<Contact[]>([])
  const [contactDropdownOpen, setContactDropdownOpen] = useState(false)
  const contactBoxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getContacts({ pageSize: 100 })
      .then((result) => setContactOptions(result.data))
      .catch(() => setContactOptions([]))
  }, [])

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
    setForm((current) => ({ ...current, stage, probability: getStageConfig(stage).default_probability }))
  }

  function selectContact(contact: Contact | null) {
    setForm((current) => ({
      ...current,
      contactId: contact?.id ?? null,
      contactName: contact?.name ?? '',
    }))
    setContactDropdownOpen(false)
  }

  const filteredContacts = contactOptions.filter((contact) =>
    contact.name.toLowerCase().includes(form.contactName.toLowerCase()),
  )

  function validate(): boolean {
    const nextErrors: Partial<Record<'title' | 'value', string>> = {}

    if (!form.title.trim()) {
      nextErrors.title = 'Informe o título do negócio.'
    }
    if (form.value) {
      const numeric = Number(form.value)
      if (Number.isNaN(numeric) || numeric < 0) {
        nextErrors.value = 'Informe um valor numérico positivo.'
      }
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
        title: form.title.trim(),
        contact_id: form.contactId,
        value: form.value ? Number(form.value) : null,
        stage: form.stage,
        status: (form.stage === 'won' ? 'won' : form.stage === 'lost' ? 'lost' : 'open') as Deal['status'],
        probability: form.probability,
        service: form.service.trim() || null,
        expected_close_date: form.expectedCloseDate || null,
        origin: form.origin.trim() || null,
        notes: form.notes.trim() || null,
        proposal_url: deal?.proposal_url ?? null,
      }

      const result = deal ? await updateDeal(deal.id, payload) : await createDeal(payload)
      toast.success(deal ? 'Negócio atualizado com sucesso.' : 'Negócio criado com sucesso.')
      onSuccess(result)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível salvar o negócio.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Título"
        required
        value={form.title}
        onChange={(event) => updateField('title', event.target.value)}
        error={errors.title}
      />

      <div ref={contactBoxRef} className="relative flex flex-col gap-1.5">
        <label className="text-sm font-medium text-neutral-700">Contato vinculado</label>
        <Input
          placeholder="Buscar contato do CRM"
          value={form.contactName}
          onChange={(event) => {
            updateField('contactName', event.target.value)
            updateField('contactId', null)
            setContactDropdownOpen(true)
          }}
          onFocus={() => setContactDropdownOpen(true)}
        />
        {contactDropdownOpen && (
          <div className="absolute left-0 top-full z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-lg">
            <button
              type="button"
              onClick={() => selectContact(null)}
              className="block w-full px-3 py-2 text-left text-sm text-neutral-500 hover:bg-neutral-50"
            >
              Nenhum contato
            </button>
            {filteredContacts.map((contact) => (
              <button
                key={contact.id}
                type="button"
                onClick={() => selectContact(contact)}
                className="block w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-purple-50"
              >
                {contact.name}
              </button>
            ))}
            {filteredContacts.length === 0 && (
              <p className="px-3 py-2 text-sm text-neutral-400">Nenhum contato encontrado.</p>
            )}
          </div>
        )}
      </div>

      <Input
        label="Valor (R$)"
        type="number"
        min="0"
        step="0.01"
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

      <Input
        label={`Probabilidade (${form.probability}%)`}
        type="range"
        min={0}
        max={100}
        value={form.probability}
        onChange={(event) => updateField('probability', Number(event.target.value))}
      />

      <div>
        <Input
          label="Serviço"
          list="service-suggestions"
          value={form.service}
          onChange={(event) => updateField('service', event.target.value)}
        />
        <datalist id="service-suggestions">
          {SERVICE_SUGGESTIONS.map((service) => (
            <option key={service} value={service} />
          ))}
        </datalist>
      </div>

      <Input
        label="Data prevista de fechamento"
        type="date"
        value={form.expectedCloseDate}
        onChange={(event) => updateField('expectedCloseDate', event.target.value)}
      />

      <div>
        <Input
          label="Origem"
          list="deal-origin-suggestions"
          value={form.origin}
          onChange={(event) => updateField('origin', event.target.value)}
        />
        <datalist id="deal-origin-suggestions">
          {ORIGIN_SUGGESTIONS.map((origin) => (
            <option key={origin} value={origin} />
          ))}
        </datalist>
      </div>

      <Textarea
        label="Observações"
        value={form.notes}
        onChange={(event) => updateField('notes', event.target.value)}
      />

      <div className="mt-2 flex justify-end gap-3">
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
