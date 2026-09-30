import { useRef, useState } from 'react'
import { CalendarPlus, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { scheduleCommercialTask } from '@/services/supabase/copilotCRM'
import { updateTask } from '@/services/supabase/tasks'
import { localDateTime, suggestedFollowUp } from '@/utils/copilotCRM'
import type { Task } from '@/types'

export const copilotField = 'mt-1 w-full min-w-0 rounded-lg border border-[var(--border-default)] bg-[var(--field-bg)] px-3 py-2 text-sm text-[var(--text-primary)]'
export interface CommercialTaskInput {
  contactId: string
  contactName: string
  title?: string
  description?: string
  kind?: NonNullable<Task['kind']>
  date?: string | null
  sourceKey?: string
  task?: Task
}

export function CommercialTaskDialog({ input, onClose, onSaved }: {
  input: CommercialTaskInput; onClose: () => void; onSaved: () => void | Promise<void>
}) {
  const [title, setTitle] = useState(input.task?.title ?? input.title ?? 'Follow-up · ' + input.contactName)
  const [date, setDate] = useState(input.task?.due_date ? localDateTime(new Date(input.task.due_date))
    : input.date && Number.isFinite(Date.parse(input.date)) ? localDateTime(new Date(input.date)) : suggestedFollowUp())
  const [kind, setKind] = useState(input.task?.kind ?? input.kind ?? 'follow_up')
  const [saving, setSaving] = useState(false)
  const lock = useRef(false)
  async function save() {
    if (lock.current) return
    if (!title.trim() || !date || !Number.isFinite(Date.parse(date))) { toast.error('Informe a ação e uma data válida.'); return }
    if (Date.parse(date) <= Date.now()) { toast.error('Escolha uma data futura.'); return }
    lock.current = true; setSaving(true)
    try {
      const dueDate = new Date(date).toISOString()
      if (input.task) await updateTask(input.task.id, { title: title.trim(), due_date: dueDate, reminder_at: dueDate, reminder_seen_at: null, status: 'todo', completed_at: null })
      else await scheduleCommercialTask({ contactId: input.contactId, title, kind, dueDate, description: input.description, sourceKey: input.sourceKey })
      toast.success(input.task ? 'Ação adiada.' : 'Ação agendada.')
      onClose(); await onSaved()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Não foi possível agendar.') }
    finally { lock.current = false; setSaving(false) }
  }
  return <Modal open onClose={() => { if (!saving) onClose() }} title={input.task ? 'Adiar ação' : 'Agendar próxima ação'}>
    <form onSubmit={(event) => { event.preventDefault(); void save() }} className="flex max-h-[70dvh] flex-col gap-4 overflow-y-auto">
      <p className="text-sm text-[var(--text-muted)]">{input.contactName}</p>
      <label className="text-sm">Ação<input required value={title} onChange={(event) => setTitle(event.target.value)} className={copilotField} /></label>
      {!input.task && <label className="text-sm">Tipo<select value={kind} onChange={(event) => setKind(event.target.value as NonNullable<Task['kind']>)} className={copilotField}>
        <option value="follow_up">Follow-up</option><option value="meeting">Reunião</option><option value="next_action">Próxima ação</option>
      </select></label>}
      <label className="text-sm">Data e horário<input required type="datetime-local" value={date} onChange={(event) => setDate(event.target.value)} className={copilotField} /></label>
      <p className="text-xs text-[var(--text-muted)]">{Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
      {input.description && <p className="text-sm text-[var(--text-secondary)]">{input.description}</p>}
      <div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button type="submit" loading={saving}><CalendarPlus className="size-4" /><Check className="size-4" />Confirmar agendamento</Button></div>
    </form>
  </Modal>
}
