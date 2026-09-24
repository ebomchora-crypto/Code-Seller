import { useState, type FormEvent } from 'react'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { INTERACTION_TYPE_LABELS, type Interaction, type InteractionType } from '@/types'

interface InteractionFormProps {
  onSubmit: (data: Omit<Interaction, 'id' | 'user_id' | 'created_at' | 'contact_id'>) => Promise<void>
}

function toLocalDateTimeInputValue(date: Date): string {
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

export function InteractionForm({ onSubmit }: InteractionFormProps) {
  const [type, setType] = useState<InteractionType>('note')
  const [content, setContent] = useState('')
  const [occurredAt, setOccurredAt] = useState(() => toLocalDateTimeInputValue(new Date()))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!content.trim()) {
      setError('Descreva a interação antes de registrar.')
      return
    }

    setSubmitting(true)
    await onSubmit({
      type,
      content: content.trim(),
      occurred_at: new Date(occurredAt).toISOString(),
    })
    setSubmitting(false)
    setContent('')
    setOccurredAt(toLocalDateTimeInputValue(new Date()))
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Select label="Tipo" value={type} onChange={(event) => setType(event.target.value as InteractionType)}>
          {Object.entries(INTERACTION_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Input
          label="Data da interação"
          type="datetime-local"
          value={occurredAt}
          onChange={(event) => setOccurredAt(event.target.value)}
        />
      </div>

      <div className="mt-3">
        <Textarea
          label="Conteúdo"
          placeholder="O que foi conversado ou feito nesta interação?"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          error={error ?? undefined}
        />
      </div>

      <div className="mt-3 flex justify-end">
        <Button type="submit" size="sm" loading={submitting}>
          Registrar
        </Button>
      </div>
    </form>
  )
}
