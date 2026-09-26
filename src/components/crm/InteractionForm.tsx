import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { INTERACTION_META } from '@/components/crm/interactionMeta'
import { INTERACTION_TYPE_LABELS, type Interaction, type InteractionType } from '@/types'

interface InteractionFormProps {
  onSubmit: (data: Omit<Interaction, 'id' | 'user_id' | 'created_at' | 'contact_id'>) => Promise<void>
}

function toLocalDateTimeInputValue(date: Date): string {
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

const TYPES = Object.keys(INTERACTION_TYPE_LABELS) as InteractionType[]

// Compositor do histórico: escolhe o tipo em chips, escreve e registra.
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
    <form
      onSubmit={handleSubmit}
      className="rounded-[20px] border border-[var(--border-default)] bg-[var(--field-bg)] transition-all focus-within:border-[var(--accent-ring)] focus-within:ring-4 focus-within:ring-[var(--accent-tint)]"
    >
      <div role="group" aria-label="Tipo de interação" className="flex flex-wrap gap-1.5 p-3 pb-0">
        {TYPES.map((value) => {
          const { icon: Icon, color } = INTERACTION_META[value]
          const active = type === value
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => setType(value)}
              className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium transition-colors ${
                active
                  ? 'border-transparent text-[var(--text-primary)]'
                  : 'border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              style={active ? { backgroundColor: `${color}26`, boxShadow: `inset 0 0 0 1px ${color}66` } : undefined}
            >
              <Icon className="size-3.5" style={active ? { color } : undefined} />
              {INTERACTION_TYPE_LABELS[value]}
            </button>
          )
        })}
      </div>

      <label htmlFor="interaction-content" className="sr-only">
        Conteúdo
      </label>
      <textarea
        id="interaction-content"
        rows={3}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="O que foi conversado ou feito nesta interação?"
        aria-invalid={Boolean(error)}
        className="block w-full resize-none bg-transparent px-4 py-3 text-[14px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
      />

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-subtle)] px-3 py-2.5">
        <label className="flex items-center gap-2 text-[12.5px] text-[var(--text-muted)]">
          Quando
          <input
            type="datetime-local"
            value={occurredAt}
            onChange={(event) => setOccurredAt(event.target.value)}
            className="h-8 rounded-lg border border-[var(--border-default)] bg-transparent px-2 text-[12.5px] text-[var(--text-secondary)] outline-none focus:border-[var(--accent-ring)]"
          />
        </label>
        <Button type="submit" size="sm" loading={submitting} className="h-9 rounded-full px-4">
          Registrar
        </Button>
      </div>

      {error && <p className="px-4 pb-3 text-xs text-red-500 dark:text-red-400">{error}</p>}
    </form>
  )
}
