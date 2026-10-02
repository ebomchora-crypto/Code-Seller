import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarPlus, Check, Clock, FileText, MessageSquare, RefreshCw, Sparkles, Users, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { CommercialTaskDialog, copilotField, type CommercialTaskInput } from './CommercialTaskDialog'
import { completeTask, updateTask } from '@/services/supabase/tasks'
import { createInteraction } from '@/services/supabase/interactions'
import { updateDealStage } from '@/services/supabase/deals'
import { updateContactStatus } from '@/services/supabase/contacts'
import { isFollowUp, isMeeting, isOpenTask, taskState, localDateTime } from '@/utils/copilotCRM'
import { DEAL_STAGES, getStageConfig } from '@/utils/deals'
import { CONTACT_STATUSES, CONTACT_STATUS_LABELS, type LeadContext, type LeadAnalysis, type DealStage, type ContactStatus, type Task } from '@/types'

export const leadPrompts = {
  analyze: 'Analise a conversa deste lead com base no histórico atualizado. Identifique interesse, etapa, evidência, objeção e próxima ação. Gere uma resposta pronta.',
  follow_up: 'Gere um follow-up contextual para este lead. Considere o tempo desde a última interação, evite repetir contatos já realizados e sugira uma próxima data quando adequado.',
  summary: 'Resuma a negociação deste lead cronologicamente, incluindo necessidades, objeções, acordos e próxima ação. Não gere mensagem para o cliente.',
  meeting: 'Prepare a próxima reunião com este lead: resumo, negócio do cliente, necessidades, objeções, histórico, perguntas sugeridas e pontos da solução a apresentar. Não gere mensagem para envio.',
}

export function LeadPanel({ lead, analysis, sending, onPrompt, onChanged }: {
  lead: LeadContext; analysis: LeadAnalysis | null; sending: boolean; onPrompt: (prompt: string) => void; onChanged: () => Promise<void>
}) {
  const [schedule, setSchedule] = useState<CommercialTaskInput | null>(null)
  const [mode, setMode] = useState<'incoming' | 'prototype' | 'meeting' | 'stage' | null>(null)
  const [notes, setNotes] = useState('')
  const [occurredAt, setOccurredAt] = useState(localDateTime(new Date()))
  const [dealId, setDealId] = useState(lead.deals[0]?.id ?? '')
  const [stage, setStage] = useState<DealStage>(lead.deals[0]?.stage ?? 'contact')
  const [contactStatus, setContactStatus] = useState<ContactStatus>(lead.contact.status)
  const [taskFilter, setTaskFilter] = useState('abertas')
  const [busy, setBusy] = useState(false)
  const lock = useRef(false)
  const activeTasks = lead.tasks.filter(isOpenTask)
  const next = activeTasks.find((task) => !isMeeting(task))
  const followUp = activeTasks.find(isFollowUp)
  const last = lead.interactions[0]
  const fields = [
    ['Etapa', lead.deals.filter((deal) => deal.status === 'open').map((deal) => deal.title + ': ' + getStageConfig(deal.stage).label).join(' · ') || CONTACT_STATUS_LABELS[lead.contact.status]],
    ['Interesse aparente', analysis?.interest ?? 'Indeterminado'],
    ['Objeção', analysis?.objection || 'Não identificada'],
    ['Última interação', last ? new Date(last.occurred_at).toLocaleString('pt-BR') : 'Sem registro'],
    ['Próxima ação', next?.title || analysis?.next_action || 'Analisar conversa'],
    ['Follow-up', followUp?.due_date ? new Date(followUp.due_date).toLocaleString('pt-BR') : 'Não agendado'],
  ]
  async function mutate(action: () => Promise<unknown>, success: string) {
    if (lock.current) return
    lock.current = true; setBusy(true)
    try { await action(); toast.success(success); await onChanged() }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Não foi possível salvar.') }
    finally { lock.current = false; setBusy(false) }
  }
  function openMode(value: NonNullable<typeof mode>) {
    setMode(value); setOccurredAt(localDateTime(new Date()))
    setNotes(value === 'prototype' && lead.prototypes[0] ? 'Protótipo enviado: ' + lead.prototypes[0].name + ' · ' + window.location.origin + '/' + lead.prototypes[0].slug : '')
  }
  async function saveForm() {
    if (mode === 'stage') {
      const deal = lead.deals.find((item) => item.id === dealId)
      await mutate(async () => {
        if (deal) await updateDealStage(deal.id, stage, deal.stage)
        else await updateContactStatus(lead.contact.id, contactStatus)
        setMode(null)
      }, 'Etapa atualizada.')
      return
    }
    if (!notes.trim()) { toast.error('Preencha as notas.'); return }
    if (!occurredAt || !Number.isFinite(Date.parse(occurredAt)) || Date.parse(occurredAt) > Date.now() + 60000) { toast.error('Informe quando a interação ocorreu.'); return }
    if (mode === 'meeting') {
      onPrompt('Organize estas notas de pós-reunião realizada em ' + new Date(occurredAt).toISOString() +
        '. Retorne resumo, necessidades, objeções, acordos, valor discutido, próxima ação e data. Proponha registrar a reunião no CRM com create_interaction e agendar follow-up separadamente, apenas se a data estiver clara. Notas do usuário:\n' + notes)
      setMode(null); return
    }
    await mutate(async () => {
      await createInteraction({ contact_id: lead.contact.id, type: 'whatsapp', content: notes.trim(), occurred_at: new Date(occurredAt).toISOString(),
        direction: mode === 'incoming' ? 'inbound' : 'outbound', metadata: mode === 'prototype' ? { event: 'prototype_sent' } : null })
      setMode(null)
      if (mode === 'incoming') onPrompt(leadPrompts.analyze)
    }, 'Interação registrada.')
  }
  const shownTasks = lead.tasks.filter((task) => taskFilter === 'todas' || (taskFilter === 'abertas' ? isOpenTask(task) : taskState(task) === taskFilter))
  return <aside aria-label="Contexto do lead" data-lenis-prevent className="h-full overflow-y-auto border-l border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
    <Link to={'/crm/' + lead.contact.id} className="block break-words text-base font-semibold text-[var(--text-primary)] hover:underline">{lead.contact.name}</Link>
    <p className="mt-1 text-xs text-[var(--text-muted)]">{[lead.contact.niche, lead.contact.city, lead.contact.state].filter(Boolean).join(' · ')}</p>
    <dl className="mt-5 space-y-3 text-sm">{fields.map(([label, value]) => <div key={label}><dt className="text-xs text-[var(--text-muted)]">{label}</dt><dd className="mt-0.5 break-words">{value}</dd></div>)}</dl>
    <div className="mt-4 grid grid-cols-1 gap-2">
      <Button size="sm" disabled={sending} onClick={() => onPrompt(leadPrompts.analyze)}><Sparkles className="size-4" />Analisar conversa</Button>
      <Button size="sm" variant="secondary" disabled={sending} onClick={() => onPrompt('Gere uma resposta para a última mensagem do lead usando o histórico completo disponível.')}><MessageSquare className="size-4" />Gerar resposta</Button>
      <Button size="sm" variant="secondary" onClick={() => openMode('incoming')} disabled={sending}><MessageSquare className="size-4" />Registrar mensagem recebida</Button>
      <Button size="sm" variant="secondary" disabled={sending} onClick={() => onPrompt(leadPrompts.follow_up)}><RefreshCw className="size-4" />Gerar follow-up</Button>
      <Button size="sm" variant="secondary" onClick={() => setSchedule({ contactId: lead.contact.id, contactName: lead.contact.name, date: analysis?.follow_up_at })}><CalendarPlus className="size-4" />Agendar follow-up</Button>
      <Button size="sm" variant="secondary" onClick={() => setSchedule({ contactId: lead.contact.id, contactName: lead.contact.name, title: 'Reunião · ' + lead.contact.name, kind: 'meeting' })}><Users className="size-4" />Agendar reunião</Button>
      <Button size="sm" variant="secondary" disabled={sending} onClick={() => onPrompt(leadPrompts.meeting)}><Users className="size-4" />Preparar reunião</Button>
      <Button size="sm" variant="secondary" disabled={sending} onClick={() => openMode('meeting')}><FileText className="size-4" />Registrar reunião</Button>
      <Button size="sm" variant="secondary" onClick={() => openMode('stage')}><RefreshCw className="size-4" />Atualizar estágio</Button>
      <Button size="sm" variant="secondary" disabled={sending} onClick={() => onPrompt(leadPrompts.summary)}><FileText className="size-4" />Resumir lead</Button>
    </div>
    <details className="mt-5 border-t border-[var(--border-subtle)] pt-4" open>
      <summary className="cursor-pointer text-sm font-semibold">Agenda e próximas ações ({activeTasks.length})</summary>
      <select aria-label="Estado das ações" className={copilotField} value={taskFilter} onChange={(event) => setTaskFilter(event.target.value)}>
        {['abertas','pendente','hoje','atrasado','concluído','cancelado','todas'].map((value) => <option key={value} value={value}>{value}</option>)}
      </select>
      {shownTasks.length === 0 && <p className="mt-3 text-xs text-[var(--text-muted)]">Nenhuma ação neste estado.</p>}
      <ul className="mt-3 divide-y divide-[var(--border-subtle)]">{shownTasks.map((task: Task) => <li key={task.id} className="py-3">
        <p className="break-words text-sm font-medium">{task.title}</p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">{taskState(task)}{task.due_date ? ' · ' + new Date(task.due_date).toLocaleString('pt-BR') : ''}</p>
        {isOpenTask(task) && <div className="mt-2 flex flex-wrap gap-2">
          <button className="p-1 text-emerald-500 disabled:opacity-40" disabled={busy} title="Marcar como realizado" aria-label={'Marcar como realizado: ' + task.title} onClick={() => void mutate(() => completeTask(task.id), 'Ação concluída.')}><Check className="size-4" /></button>
          <button className="p-1 text-[var(--text-muted)]" title="Adiar" aria-label={'Adiar: ' + task.title} onClick={() => setSchedule({ contactId: lead.contact.id, contactName: lead.contact.name, task })}><Clock className="size-4" /></button>
          <button className="p-1 text-red-400 disabled:opacity-40" disabled={busy} title="Cancelar ação" aria-label={'Cancelar: ' + task.title} onClick={() => void mutate(() => updateTask(task.id, {status:'cancelled'}), 'Ação cancelada.')}><X className="size-4" /></button>
          <button disabled={sending} className="text-xs text-[var(--accent-text)]" onClick={() => onPrompt(isMeeting(task) ? leadPrompts.meeting : leadPrompts.follow_up)}>{isMeeting(task) ? 'Preparar reunião' : 'Gerar follow-up'}</button>
        </div>}
      </li>)}</ul>
    </details>
    <details className="mt-4 border-t border-[var(--border-subtle)] pt-4">
      <summary className="cursor-pointer text-sm font-semibold">Protótipos e propostas</summary>
      <ul className="mt-3 space-y-2 text-xs">{lead.prototypes.map((site) => <li key={site.id}>{site.name} · {site.status}{site.published && site.status === 'ready' && <Link className="ml-2 underline" to={'/' + site.slug} target="_blank">Abrir</Link>}</li>)}
        {lead.proposals.map((proposal) => <li key={proposal.id}>{proposal.title} · {proposal.status}</li>)}</ul>
      <Button className="mt-3" size="sm" variant="secondary" onClick={() => openMode('prototype')}>Registrar envio de protótipo</Button>
    </details>
    {schedule && <CommercialTaskDialog input={schedule} onClose={() => setSchedule(null)} onSaved={onChanged} />}
    {mode && <Modal open onClose={() => { if (!busy) setMode(null) }} title={mode === 'incoming' ? 'Mensagem recebida' : mode === 'prototype' ? 'Registrar envio de protótipo' : mode === 'meeting' ? 'Notas da reunião' : 'Atualizar estágio'}>
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void saveForm() }}>
        {mode === 'stage' ? lead.deals.length ? <>
          <label className="block text-sm">Negócio<select className={copilotField} value={dealId} onChange={(event) => { setDealId(event.target.value); setStage(lead.deals.find((deal) => deal.id === event.target.value)?.stage ?? 'contact') }}>{lead.deals.map((deal) => <option key={deal.id} value={deal.id}>{deal.title}</option>)}</select></label>
          <label className="block text-sm">Etapa<select className={copilotField} value={stage} onChange={(event) => setStage(event.target.value as DealStage)}>{DEAL_STAGES.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select></label>
        </> : <label className="block text-sm">Status do contato<select className={copilotField} value={contactStatus} onChange={(event) => setContactStatus(event.target.value as ContactStatus)}>{CONTACT_STATUSES.map((value) => <option key={value} value={value}>{CONTACT_STATUS_LABELS[value]}</option>)}</select></label> : <>
          <label className="block text-sm">{mode === 'meeting' ? 'Notas' : 'Mensagem ou registro'}<textarea required rows={6} className={copilotField} value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
          <label className="block text-sm">Quando ocorreu<input required type="datetime-local" className={copilotField} value={occurredAt} onChange={(event) => setOccurredAt(event.target.value)} /></label>
        </>}
        <div className="flex justify-end"><Button type="submit" loading={busy} disabled={sending}>{mode === 'meeting' ? 'Organizar notas com IA' : mode === 'incoming' ? 'Registrar e analisar' : 'Confirmar registro'}</Button></div>
      </form>
    </Modal>}
  </aside>
}
