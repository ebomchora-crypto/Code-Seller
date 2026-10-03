import { useRef, useState } from 'react'
import { MessageSquareText, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { SettingsSection } from '@/components/settings/SettingsSection'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useTemplates } from '@/hooks/useTemplates'
import { TEMPLATE_CATEGORY_LABELS, TEMPLATE_VARIABLES } from '@/utils/templates'
import type { MessageTemplate, TemplateCategory } from '@/types'

interface Draft {
  id: string | null
  name: string
  category: TemplateCategory
  body: string
}

// Na ordem da venda, com uma linha dizendo onde cada tipo é usado.
const TEMPLATE_GROUPS: { category: TemplateCategory; hint: string }[] = [
  { category: 'abordagem', hint: 'O primeiro contato com quem ainda não te conhece.' },
  { category: 'follow_up', hint: 'Vão nos retornos do follow-up automático: o 1º no 1º retorno, o 2º no 2º, e assim por diante.' },
  { category: 'proposta', hint: 'Para enviar e acompanhar a proposta.' },
  { category: 'cobranca', hint: 'Para lembrar pagamentos.' },
  { category: 'outro', hint: 'Qualquer outra mensagem.' },
]

const fieldClass =
  'w-full rounded-xl border border-[var(--border-default)] bg-[var(--field-bg)] px-4 text-[14px] text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-ring)] focus:ring-4 focus:ring-[var(--accent-tint)]'

export function TemplatesSection() {
  const { templates, loading, error, create, update, remove } = useTemplates()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<MessageTemplate | null>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  function insertVariable(key: string) {
    if (!draft) return
    const token = `{${key}}`
    const textarea = bodyRef.current
    const start = textarea?.selectionStart ?? draft.body.length
    const end = textarea?.selectionEnd ?? draft.body.length
    const body = draft.body.slice(0, start) + token + draft.body.slice(end)
    setDraft({ ...draft, body })
    requestAnimationFrame(() => {
      textarea?.focus()
      textarea?.setSelectionRange(start + token.length, start + token.length)
    })
  }

  async function save() {
    if (!draft || !draft.name.trim() || !draft.body.trim()) return
    setSaving(true)
    try {
      const input = { name: draft.name.trim(), category: draft.category, body: draft.body.trim() }
      if (draft.id) await update(draft.id, input)
      else await create(input)
      setDraft(null)
    } catch {
      toast.error('Não foi possível salvar o modelo.')
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    try {
      await remove(deleting.id)
    } catch {
      toast.error('Não foi possível excluir o modelo.')
    }
    setDeleting(null)
  }

  return (
    <SettingsSection
      id="modelos"
      icon={MessageSquareText}
      title="Mensagens prontas"
      description="Textos prontos para o WhatsApp. O nome do contato e os outros dados entram sozinhos na hora de enviar."
      action={
        <Button
          size="sm"
          className="rounded-full"
          onClick={() => setDraft({ id: null, name: '', category: 'abordagem', body: '' })}
        >
          <Plus className="size-4" />
          Novo modelo
        </Button>
      }
    >
      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <p className="text-[13.5px] text-red-500">{error}</p>
      ) : templates.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--border-default)] px-4 py-6 text-center text-[13.5px] text-[var(--text-muted)]">
          Nenhum modelo ainda. Crie o primeiro em “Novo modelo”.
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {TEMPLATE_GROUPS.map((group) => {
            const items = templates.filter((template) => template.category === group.category)
            if (!items.length) return null
            return (
              <div key={group.category}>
                <div className="mb-2 flex flex-wrap items-baseline gap-x-2 px-1">
                  <h3 className="text-[13.5px] font-semibold text-[var(--text-primary)]">{TEMPLATE_CATEGORY_LABELS[group.category]}</h3>
                  <span className="text-[12px] text-[var(--text-muted)]">{group.hint}</span>
                </div>
                <div className="divide-y divide-[var(--border-subtle)] rounded-2xl border border-[var(--border-default)]">
                  {items.map((template) => (
                    <div key={template.id} className="flex items-center gap-3 px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setDraft({ id: template.id, name: template.name, category: template.category, body: template.body })}
                        className="min-w-0 flex-1 text-left"
                      >
                        <span className="block truncate text-[14px] font-medium text-[var(--text-primary)]">{template.name}</span>
                        <span className="block truncate text-[12.5px] text-[var(--text-muted)]">{template.body}</span>
                      </button>
                      <div className="flex shrink-0 gap-0.5">
                        <button
                          type="button"
                          onClick={() => setDraft({ id: template.id, name: template.name, category: template.category, body: template.body })}
                          aria-label={`Editar ${template.name}`}
                          className="flex size-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--accent-text)]"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(template)}
                          aria-label={`Excluir ${template.name}`}
                          className="flex size-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-500"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={draft !== null} onClose={() => setDraft(null)} title={draft?.id ? 'Editar modelo' : 'Novo modelo'} size="lg">
        {draft && (
          <div className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
              <label className="flex flex-col gap-1.5 text-[13px] font-medium text-[var(--text-secondary)]">
                Nome
                <input
                  value={draft.name}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                  placeholder="Ex.: Follow-up depois da proposta"
                  className={`${fieldClass} h-11`}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-[13px] font-medium text-[var(--text-secondary)]">
                Tipo
                <select
                  value={draft.category}
                  onChange={(event) => setDraft({ ...draft, category: event.target.value as TemplateCategory })}
                  className={`${fieldClass} h-11`}
                >
                  {(Object.keys(TEMPLATE_CATEGORY_LABELS) as TemplateCategory[]).map((category) => (
                    <option key={category} value={category}>
                      {TEMPLATE_CATEGORY_LABELS[category]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="flex flex-col gap-1.5 text-[13px] font-medium text-[var(--text-secondary)]">
              Mensagem
              <textarea
                ref={bodyRef}
                value={draft.body}
                onChange={(event) => setDraft({ ...draft, body: event.target.value })}
                rows={6}
                className={`${fieldClass} resize-none py-3 leading-6`}
              />
            </label>
            <div>
              <p className="text-[12px] text-[var(--text-muted)]">Toque para inserir um campo que se preenche sozinho:</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {TEMPLATE_VARIABLES.map((variable) => (
                  <button
                    key={variable.key}
                    type="button"
                    title={variable.description}
                    onClick={() => insertVariable(variable.key)}
                    className="h-7 rounded-full border border-dashed border-[var(--border-strong)] px-2.5 font-mono text-[11.5px] text-[var(--text-secondary)] hover:border-[var(--accent-ring)] hover:text-[var(--accent-text)]"
                  >
                    {`{${variable.key}}`}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDraft(null)}>
                Cancelar
              </Button>
              <Button onClick={() => void save()} loading={saving} disabled={!draft.name.trim() || !draft.body.trim()}>
                Salvar modelo
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Excluir modelo"
        message={`Excluir o modelo "${deleting?.name}"?`}
        confirmLabel="Excluir"
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      />
    </SettingsSection>
  )
}
