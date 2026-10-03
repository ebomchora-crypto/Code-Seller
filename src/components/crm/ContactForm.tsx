import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { ChoiceField } from '@/components/ui/ChoiceField'
import { CONTACT_STATUS_COLORS } from '@/components/crm/statusColors'
import { mergeChoices } from '@/utils/choiceList'
import { createContact, getContactFacets, updateContact } from '@/services/supabase/contacts'
import {
  BRAZILIAN_STATES,
  CONTACT_STATUS_LABELS,
  CONTACT_STATUSES,
  NICHE_SUGGESTIONS,
  ORIGIN_SUGGESTIONS,
  type Contact,
  type ContactStatus,
} from '@/types'

interface ContactFormProps {
  contact?: Contact
  onSuccess: (contact: Contact) => void
  onCancel: () => void
}

interface FormState {
  name: string
  email: string
  phone: string
  niche: string
  city: string
  state: string
  status: ContactStatus
  origin: string
  current_site: string
  notes: string
}

function buildInitialState(contact?: Contact): FormState {
  return {
    name: contact?.name ?? '',
    email: contact?.email ?? '',
    phone: contact?.phone ?? '',
    niche: contact?.niche ?? '',
    city: contact?.city ?? '',
    state: contact?.state ?? '',
    status: contact?.status ?? 'lead',
    origin: contact?.origin ?? '',
    current_site: contact?.current_site ?? '',
    notes: contact?.notes ?? '',
  }
}

const STATUS_HINTS: Record<ContactStatus, string> = {
  lead: 'Ainda não conversou de verdade ou só fez o primeiro contato.',
  negotiating: 'Já está conversando sobre um serviço ou proposta.',
  client: 'Já comprou de você.',
  inactive: 'Parou de responder por enquanto.',
  lost: 'Não tem interesse agora.',
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const URL_PATTERN = /^https?:\/\/.+\..+/

export function ContactForm({ contact, onSuccess, onCancel }: ContactFormProps) {
  const [form, setForm] = useState<FormState>(buildInitialState(contact))
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [nicheOptions, setNicheOptions] = useState<string[]>(NICHE_SUGGESTIONS)
  const [originOptions, setOriginOptions] = useState<string[]>(ORIGIN_SUGGESTIONS)

  // Também oferece nichos/origens que a pessoa já usou antes.
  useEffect(() => {
    let cancelled = false
    void getContactFacets().then(({ niches, origins }) => {
      if (cancelled) return
      setNicheOptions(mergeChoices(NICHE_SUGGESTIONS, niches))
      setOriginOptions(mergeChoices(ORIGIN_SUGGESTIONS, origins))
    })
    return () => {
      cancelled = true
    }
  }, [])

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function validate(): boolean {
    const nextErrors: Partial<Record<keyof FormState, string>> = {}

    if (!form.name.trim()) {
      nextErrors.name = 'Informe o nome do contato.'
    }
    if (form.email && !EMAIL_PATTERN.test(form.email)) {
      nextErrors.email = 'Informe um e-mail válido.'
    }
    if (form.current_site && !URL_PATTERN.test(form.current_site)) {
      nextErrors.current_site = 'Informe uma URL válida (ex: https://exemplo.com).'
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
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        niche: form.niche.trim() || null,
        city: form.city.trim() || null,
        state: form.state || null,
        status: form.status,
        origin: form.origin.trim() || null,
        current_site: form.current_site.trim() || null,
        notes: form.notes.trim() || null,
        assigned_to: contact?.assigned_to ?? null,
      }

      const result = contact ? await updateContact(contact.id, payload) : await createContact(payload)
      toast.success(contact ? 'Contato atualizado com sucesso.' : 'Contato criado com sucesso.')
      onSuccess(result)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível salvar o contato.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <FormSection title="Quem é">
        <Input
          label="Nome da empresa ou pessoa"
          required
          placeholder="Ex.: Barbearia do João"
          value={form.name}
          onChange={(event) => updateField('name', event.target.value)}
          error={errors.name}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="WhatsApp / telefone"
            placeholder="(11) 99999-9999"
            helperText="Fora do Brasil, comece com + e o código do país (ex.: +351)."
            inputMode="tel"
            value={form.phone}
            onChange={(event) => updateField('phone', event.target.value)}
          />
          <Input
            label="E-mail"
            type="email"
            placeholder="opcional"
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
            error={errors.email}
          />
        </div>
      </FormSection>

      <FormSection title="Sobre o negócio">
        <ChoiceField
          label="Nicho"
          placeholder="Escolha abaixo ou digite outro"
          value={form.niche}
          onChange={(value) => updateField('niche', value)}
          options={nicheOptions}
        />
        <div className="grid grid-cols-[1fr_110px] gap-3">
          <Input label="Cidade" value={form.city} onChange={(event) => updateField('city', event.target.value)} />
          <Select label="Estado" value={form.state} onChange={(event) => updateField('state', event.target.value)}>
            <option value="">UF</option>
            {BRAZILIAN_STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </Select>
        </div>
      </FormSection>

      <FormSection title="Como chegou até você">
        <ChoiceField
          label="Origem"
          placeholder="Escolha abaixo ou digite outra"
          value={form.origin}
          onChange={(value) => updateField('origin', value)}
          options={originOptions}
          visible={8}
        />
      </FormSection>

      <FormSection title="Em que pé está">
        <div role="radiogroup" aria-label="Status" className="flex flex-wrap gap-1.5">
          {CONTACT_STATUSES.map((status) => {
            const active = form.status === status
            const color = CONTACT_STATUS_COLORS[status]
            return (
              <button
                key={status}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => updateField('status', status)}
                className={`inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-[13px] font-medium transition-colors ${
                  active
                    ? 'border-[var(--accent-ring)] bg-[var(--accent-tint)] text-[var(--text-primary)]'
                    : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                }`}
              >
                <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
                {CONTACT_STATUS_LABELS[status]}
              </button>
            )
          })}
        </div>
        <p className="text-[12px] leading-snug text-[var(--text-muted)]">
          {STATUS_HINTS[form.status]} Muda sozinho quando você abre ou ganha um negócio com ele.
        </p>
      </FormSection>

      <details
        className="group rounded-2xl border border-[var(--border-default)] px-4 py-3"
        open={Boolean(contact?.current_site || contact?.notes)}
      >
        <summary className="cursor-pointer text-[13.5px] font-medium text-[var(--text-primary)]">
          Mais detalhes <span className="font-normal text-[var(--text-muted)]">(site atual e observações)</span>
        </summary>
        <div className="mt-4 flex flex-col gap-4">
          <Input
            label="Site atual"
            placeholder="https://exemplo.com"
            value={form.current_site}
            onChange={(event) => updateField('current_site', event.target.value)}
            error={errors.current_site}
          />
          <Textarea
            label="Observações"
            value={form.notes}
            onChange={(event) => updateField('notes', event.target.value)}
          />
        </div>
      </details>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {contact ? 'Salvar alterações' : 'Criar contato'}
        </Button>
      </div>
    </form>
  )
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">{title}</h3>
      {children}
    </section>
  )
}
