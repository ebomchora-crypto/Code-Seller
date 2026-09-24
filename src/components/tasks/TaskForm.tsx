import { useEffect, useRef, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { getContacts } from '@/services/supabase/contacts'
import { getDeals } from '@/services/supabase/deals'
import { addTagToTask, createTask, removeTagFromTask, updateTask } from '@/services/supabase/tasks'
import { useTags } from '@/hooks/useTags'
import { TASK_PRIORITY_CONFIG, TASK_RECURRENCE_LABELS, TASK_STATUS_CONFIG } from '@/utils/tasks'
import type {
  Contact,
  Deal,
  Task,
  TaskPriority,
  TaskRecurrence,
  TaskStatus,
} from '@/types'

interface TaskFormProps {
  task?: Task
  defaultStatus?: TaskStatus
  defaultContactId?: string
  defaultContactName?: string
  defaultDealId?: string
  defaultDealTitle?: string
  onSuccess: (task: Task) => void
  onCancel: () => void
}

interface FormState {
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  dueDate: string
  reminderAt: string
  contactId: string | null
  contactName: string
  dealId: string | null
  dealTitle: string
  tagIds: string[]
  recurrence: TaskRecurrence
  recurrenceEndDate: string
}

function toDateTimeLocal(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16)
}

function buildInitialState(task?: Task, defaults?: Partial<FormState>): FormState {
  return {
    title: task?.title ?? '',
    description: task?.description ?? '',
    status: task?.status ?? defaults?.status ?? 'todo',
    priority: task?.priority ?? 'medium',
    dueDate: toDateTimeLocal(task?.due_date ?? null),
    reminderAt: toDateTimeLocal(task?.reminder_at ?? null),
    contactId: task?.contact_id ?? defaults?.contactId ?? null,
    contactName: task?.contact?.name ?? defaults?.contactName ?? '',
    dealId: task?.deal_id ?? defaults?.dealId ?? null,
    dealTitle: task?.deal?.title ?? defaults?.dealTitle ?? '',
    tagIds: task?.tags?.map((tag) => tag.id) ?? [],
    recurrence: task?.recurrence ?? 'none',
    recurrenceEndDate: task?.recurrence_end_date ?? '',
  }
}

export function TaskForm({
  task,
  defaultStatus,
  defaultContactId,
  defaultContactName,
  defaultDealId,
  defaultDealTitle,
  onSuccess,
  onCancel,
}: TaskFormProps) {
  const [form, setForm] = useState<FormState>(
    buildInitialState(task, {
      status: defaultStatus,
      contactId: defaultContactId,
      contactName: defaultContactName,
      dealId: defaultDealId,
      dealTitle: defaultDealTitle,
    }),
  )
  const [errors, setErrors] = useState<Partial<Record<'title' | 'reminderAt' | 'recurrenceEndDate', string>>>({})
  const [submitting, setSubmitting] = useState(false)

  const { tags, createTag } = useTags()
  const [contactOptions, setContactOptions] = useState<Contact[]>([])
  const [contactDropdownOpen, setContactDropdownOpen] = useState(false)
  const contactBoxRef = useRef<HTMLDivElement>(null)

  const [dealOptions, setDealOptions] = useState<Deal[]>([])
  const [dealDropdownOpen, setDealDropdownOpen] = useState(false)
  const dealBoxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getContacts({ pageSize: 100 }).then((result) => setContactOptions(result.data)).catch(() => setContactOptions([]))
    getDeals({}).then((result) => setDealOptions(result.data)).catch(() => setDealOptions([]))
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (contactBoxRef.current && !contactBoxRef.current.contains(event.target as Node)) setContactDropdownOpen(false)
      if (dealBoxRef.current && !dealBoxRef.current.contains(event.target as Node)) setDealDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function selectContact(contact: Contact | null) {
    setForm((current) => ({
      ...current,
      contactId: contact?.id ?? null,
      contactName: contact?.name ?? '',
      dealId: contact ? current.dealId : null,
      dealTitle: contact ? current.dealTitle : '',
    }))
    setContactDropdownOpen(false)
  }

  function selectDeal(deal: Deal | null) {
    setForm((current) => ({ ...current, dealId: deal?.id ?? null, dealTitle: deal?.title ?? '' }))
    setDealDropdownOpen(false)
  }

  function toggleTag(tagId: string) {
    setForm((current) => ({
      ...current,
      tagIds: current.tagIds.includes(tagId) ? current.tagIds.filter((id) => id !== tagId) : [...current.tagIds, tagId],
    }))
  }

  async function handleCreateTag() {
    const name = window.prompt('Nome da nova tag:')
    if (!name?.trim()) return
    const tag = await createTag(name.trim(), '#b35cff')
    if (tag) toggleTag(tag.id)
  }

  const filteredContacts = contactOptions.filter((contact) =>
    contact.name.toLowerCase().includes(form.contactName.toLowerCase()),
  )
  const dealsForContact = form.contactId ? dealOptions.filter((deal) => deal.contact_id === form.contactId) : dealOptions
  const filteredDeals = dealsForContact.filter((deal) => deal.title.toLowerCase().includes(form.dealTitle.toLowerCase()))

  function validate(): boolean {
    const nextErrors: typeof errors = {}

    if (!form.title.trim()) {
      nextErrors.title = 'Informe o título da tarefa.'
    }
    if (form.reminderAt && form.dueDate && new Date(form.reminderAt) >= new Date(form.dueDate)) {
      nextErrors.reminderAt = 'O lembrete deve ser antes do vencimento.'
    }
    if (form.recurrence !== 'none' && !form.recurrenceEndDate) {
      nextErrors.recurrenceEndDate = 'Informe até quando a recorrência deve se repetir.'
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
        description: form.description.trim() || null,
        status: form.status,
        priority: form.priority,
        due_date: form.dueDate ? new Date(form.dueDate).toISOString() : null,
        reminder_at: form.reminderAt ? new Date(form.reminderAt).toISOString() : null,
        contact_id: form.contactId,
        deal_id: form.dealId,
        assigned_to: task?.assigned_to ?? null,
        recurrence: form.recurrence,
        recurrence_end_date: form.recurrence !== 'none' ? form.recurrenceEndDate || null : null,
        parent_task_id: task?.parent_task_id ?? null,
        position: task?.position ?? 0,
        completed_at: task?.completed_at ?? null,
      }

      const result = task ? await updateTask(task.id, payload) : await createTask(payload)

      const existingTagIds = task?.tags?.map((tag) => tag.id) ?? []
      const toAdd = form.tagIds.filter((id) => !existingTagIds.includes(id))
      const toRemove = existingTagIds.filter((id) => !form.tagIds.includes(id))
      if (toAdd.length > 0 || toRemove.length > 0) {
        await Promise.all([
          ...toAdd.map((tagId) => addTagToTask(result.id, tagId)),
          ...toRemove.map((tagId) => removeTagFromTask(result.id, tagId)),
        ])
      }

      toast.success(task ? 'Tarefa atualizada com sucesso.' : 'Tarefa criada com sucesso.')
      onSuccess(result)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível salvar a tarefa.')
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
        className="text-base font-medium"
      />

      <Textarea
        label="Descrição"
        value={form.description}
        onChange={(event) => updateField('description', event.target.value)}
      />

      <Select label="Status" required value={form.status} onChange={(event) => updateField('status', event.target.value as TaskStatus)}>
        {Object.entries(TASK_STATUS_CONFIG).map(([value, config]) => (
          <option key={value} value={value}>
            {config.label}
          </option>
        ))}
      </Select>

      <div>
        <label className="text-sm font-medium text-neutral-700">Prioridade</label>
        <div className="mt-1.5 grid grid-cols-4 gap-1">
          {(Object.entries(TASK_PRIORITY_CONFIG) as [TaskPriority, (typeof TASK_PRIORITY_CONFIG)[TaskPriority]][]).map(
            ([value, config]) => (
              <button
                key={value}
                type="button"
                onClick={() => updateField('priority', value)}
                className={`rounded-md py-2 text-xs font-medium transition-colors duration-150 ${
                  form.priority === value ? 'text-white' : 'bg-neutral-100 text-neutral-500'
                }`}
                style={form.priority === value ? { backgroundColor: config.color } : undefined}
              >
                {config.label}
              </button>
            ),
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Vencimento"
          type="datetime-local"
          value={form.dueDate}
          onChange={(event) => updateField('dueDate', event.target.value)}
        />
        <Input
          label="Lembrete"
          type="datetime-local"
          value={form.reminderAt}
          onChange={(event) => updateField('reminderAt', event.target.value)}
          error={errors.reminderAt}
        />
      </div>

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
            <button type="button" onClick={() => selectContact(null)} className="block w-full px-3 py-2 text-left text-sm text-neutral-500 hover:bg-neutral-50">
              Nenhum contato
            </button>
            {filteredContacts.map((contact) => (
              <button key={contact.id} type="button" onClick={() => selectContact(contact)} className="block w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-purple-50">
                {contact.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div ref={dealBoxRef} className="relative flex flex-col gap-1.5">
        <label className="text-sm font-medium text-neutral-700">Negócio vinculado</label>
        <Input
          placeholder="Buscar negócio"
          value={form.dealTitle}
          onChange={(event) => {
            updateField('dealTitle', event.target.value)
            updateField('dealId', null)
            setDealDropdownOpen(true)
          }}
          onFocus={() => setDealDropdownOpen(true)}
        />
        {dealDropdownOpen && (
          <div className="absolute left-0 top-full z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-lg">
            <button type="button" onClick={() => selectDeal(null)} className="block w-full px-3 py-2 text-left text-sm text-neutral-500 hover:bg-neutral-50">
              Nenhum negócio
            </button>
            {filteredDeals.map((deal) => (
              <button key={deal.id} type="button" onClick={() => selectDeal(deal)} className="block w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-purple-50">
                {deal.title}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="text-sm font-medium text-neutral-700">Tags</label>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {tags.map((tag) => {
            const selected = form.tagIds.includes(tag.id)
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className="rounded-full px-2.5 py-1 text-xs font-medium transition-colors"
                style={
                  selected
                    ? { backgroundColor: tag.color, color: 'white' }
                    : { backgroundColor: `${tag.color}1a`, color: tag.color }
                }
              >
                {tag.name}
              </button>
            )
          })}
          <button
            type="button"
            onClick={handleCreateTag}
            className="rounded-full border border-dashed border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-500 hover:border-purple-300 hover:text-purple-600"
          >
            + Criar tag
          </button>
        </div>
      </div>

      <Select
        label="Recorrência"
        value={form.recurrence}
        onChange={(event) => updateField('recurrence', event.target.value as TaskRecurrence)}
      >
        {Object.entries(TASK_RECURRENCE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>

      {form.recurrence !== 'none' && (
        <>
          <Input
            label="Data de fim da recorrência"
            type="date"
            required
            value={form.recurrenceEndDate}
            onChange={(event) => updateField('recurrenceEndDate', event.target.value)}
            error={errors.recurrenceEndDate}
          />
          {form.recurrenceEndDate && (
            <p className="rounded-lg bg-purple-50 px-3 py-2 text-xs text-purple-700">
              Serão criadas tarefas recorrentes até {new Date(`${form.recurrenceEndDate}T00:00:00`).toLocaleDateString('pt-BR')}.
            </p>
          )}
        </>
      )}

      <div className="mt-2 flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {task ? 'Salvar alterações' : 'Criar tarefa'}
        </Button>
      </div>
    </form>
  )
}
