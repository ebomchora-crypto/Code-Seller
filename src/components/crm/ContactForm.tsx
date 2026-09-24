import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { createContact, updateContact } from '@/services/supabase/contacts'
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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const URL_PATTERN = /^https?:\/\/.+\..+/

export function ContactForm({ contact, onSuccess, onCancel }: ContactFormProps) {
  const [form, setForm] = useState<FormState>(buildInitialState(contact))
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [submitting, setSubmitting] = useState(false)

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Nome"
        required
        value={form.name}
        onChange={(event) => updateField('name', event.target.value)}
        error={errors.name}
      />

      <Input
        label="E-mail"
        type="email"
        value={form.email}
        onChange={(event) => updateField('email', event.target.value)}
        error={errors.email}
      />

      <Input
        label="WhatsApp/Telefone"
        value={form.phone}
        onChange={(event) => updateField('phone', event.target.value)}
      />

      <div>
        <Input
          label="Nicho/Segmento"
          list="niche-suggestions"
          value={form.niche}
          onChange={(event) => updateField('niche', event.target.value)}
        />
        <datalist id="niche-suggestions">
          {NICHE_SUGGESTIONS.map((niche) => (
            <option key={niche} value={niche} />
          ))}
        </datalist>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Cidade"
          value={form.city}
          onChange={(event) => updateField('city', event.target.value)}
        />
        <Select label="Estado" value={form.state} onChange={(event) => updateField('state', event.target.value)}>
          <option value="">Selecione</option>
          {BRAZILIAN_STATES.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </Select>
      </div>

      <Select
        label="Status"
        required
        value={form.status}
        onChange={(event) => updateField('status', event.target.value as ContactStatus)}
      >
        {CONTACT_STATUSES.map((status) => (
          <option key={status} value={status}>
            {CONTACT_STATUS_LABELS[status]}
          </option>
        ))}
      </Select>

      <div>
        <Input
          label="Origem"
          list="origin-suggestions"
          value={form.origin}
          onChange={(event) => updateField('origin', event.target.value)}
        />
        <datalist id="origin-suggestions">
          {ORIGIN_SUGGESTIONS.map((origin) => (
            <option key={origin} value={origin} />
          ))}
        </datalist>
      </div>

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

      <div className="mt-2 flex justify-end gap-3">
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
