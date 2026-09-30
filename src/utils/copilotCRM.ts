import type { Contact, Interaction } from '../types/crm'
import type { Task } from '../types/tasks'
import type { CommercialResponseMode, LeadAnalysis } from '../types/autopilot'

export type FollowUpState = 'pendente' | 'hoje' | 'atrasado' | 'concluído' | 'cancelado'
export type AttentionKind = 'follow_up' | 'next_action' | 'reply' | 'waiting' | 'prototype' | 'meeting' | 'inactive'
export interface AttentionItem {
  id: string
  kind: AttentionKind
  contact: Contact
  title: string
  reason: string
  occurred_at: string
  task?: Task
}

export function taskState(task: Pick<Task, 'status' | 'due_date'>, now = new Date()): FollowUpState {
  if (task.status === 'done') return 'concluído'
  if (task.status === 'cancelled') return 'cancelado'
  if (!task.due_date) return 'pendente'
  const due = new Date(task.due_date)
  if (!Number.isFinite(due.getTime())) return 'pendente'
  if (due < now) return 'atrasado'
  return due.toDateString() === now.toDateString() ? 'hoje' : 'pendente'
}

export function isFollowUp(task: Task): boolean {
  return task.kind === 'follow_up' || (task.followup_step != null && task.followup_step > 0) || /follow[ -]?up/i.test(task.title)
}

export function isMeeting(task: Task): boolean {
  return task.kind === 'meeting' || /reunião|reuniao|\bcall\b/i.test(task.title)
}

export function isOpenTask(task: Task): boolean {
  return task.status === 'todo' || task.status === 'in_progress'
}

export function localDateTime(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

export function suggestedFollowUp(from = new Date(), days = 2): string {
  return localDateTime(new Date(from.getFullYear(), from.getMonth(), from.getDate() + days, 10))
}

export function parseLeadAnalysis(value: unknown): LeadAnalysis | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const row = value as Record<string, unknown>
  const fields = ['stage', 'evidence', 'objection', 'summary', 'next_action', 'suggested_message'] as const
  if (fields.some((key) => typeof row[key] !== 'string')) return null
  const interest = (['Baixo', 'Moderado', 'Alto', 'Indeterminado'] as const)
    .find((level) => level.toLowerCase() === String(row.interest).trim().toLowerCase()) ?? 'Indeterminado'
  const mode = (['quick_reply', 'analysis', 'objection', 'follow_up'] as const)
    .find((candidate) => candidate === String(row.mode)) ?? 'analysis'
  const followUp = typeof row.follow_up_at === 'string' && Number.isFinite(Date.parse(row.follow_up_at))
    ? row.follow_up_at : null
  return { mode: mode as CommercialResponseMode, interest, stage: row.stage as string, evidence: row.evidence as string, objection: row.objection as string,
    risk: typeof row.risk === 'string' && row.risk.trim() ? row.risk : 'Não identificado',
    summary: row.summary as string, next_action: row.next_action as string,
    reason: typeof row.reason === 'string' ? row.reason : '',
    strategy: typeof row.strategy === 'string' ? row.strategy : '',
    suggested_message: row.suggested_message as string,
    next_step: typeof row.next_step === 'string' ? row.next_step : '', follow_up_at: followUp }
}

export function buildAttentionItems(contacts: Contact[], interactions: Interaction[], tasks: Task[], now = new Date()): AttentionItem[] {
  const byContact = new Map<string, Interaction[]>()
  for (const interaction of interactions) {
    if (new Date(interaction.occurred_at) > now) continue
    const list = byContact.get(interaction.contact_id) ?? []
    list.push(interaction)
    byContact.set(interaction.contact_id, list)
  }
  const contactMap = new Map(contacts.map((contact) => [contact.id, contact]))
  const handled = new Set(tasks.map((task) => task.copilot_key).filter(Boolean))
  const result: AttentionItem[] = []
  for (const task of tasks) {
    const contact = task.contact_id ? contactMap.get(task.contact_id) : null
    if (!contact || !isOpenTask(task)) continue
    const state = taskState(task, now)
    if (isMeeting(task) && task.due_date && new Date(task.due_date).toDateString() === now.toDateString()) {
      result.push({ id: task.id, kind: 'meeting', contact, title: task.title, reason: 'Reunião agendada para hoje.', occurred_at: task.due_date, task })
    } else if (!isMeeting(task) && (state === 'hoje' || state === 'atrasado' || !task.due_date)) {
      result.push({ id: task.id, kind: isFollowUp(task) ? 'follow_up' : 'next_action', contact, title: task.title, reason: state === 'atrasado' ? 'O prazo desta ação já passou.' : 'Próxima ação agendada.', occurred_at: task.due_date ?? task.created_at, task })
    }
  }
  for (const contact of contacts) {
    if (!['lead', 'negotiating'].includes(contact.status)) continue
    const history = (byContact.get(contact.id) ?? []).sort((a, b) => Date.parse(b.occurred_at) - Date.parse(a.occurred_at))
    const communication = history.filter((row) => row.direction || ['call', 'email', 'whatsapp', 'meeting', 'proposal'].includes(row.type))
    const last = communication[0]
    const lastKnown = communication.find((row) => row.direction)
    // An unclassified later interaction may already be a reply; don't infer silence across it.
    if (last && last.id === lastKnown?.id) {
      const kind: AttentionKind = last.direction === 'inbound' ? 'reply' : last.metadata?.event === 'prototype_sent' ? 'prototype' : 'waiting'
      const id = kind + ':' + last.id
      if (!handled.has(id)) result.push({
        id, kind, contact, occurred_at: last.occurred_at,
        title: kind === 'reply' ? 'Responder ao lead' : kind === 'prototype' ? 'Protótipo aguardando retorno' : 'Aguardando resposta',
        reason: kind === 'reply' ? 'A última mensagem registrada foi recebida do lead.' : 'Sem resposta registrada após o último envio.',
      })
    }
    const lastAt = last?.occurred_at ?? contact.created_at
    const days = Math.floor((now.getTime() - Date.parse(lastAt)) / 86400000)
    const id = 'inactive:' + contact.id + ':' + lastAt
    if (days > 3 && !handled.has(id)) result.push({
      id, kind: 'inactive', contact, title: 'Retomar contato',
      reason: last ? 'Última interação comercial registrada há ' + days + ' dias.' : 'Lead criado há ' + days + ' dias, sem interação comercial registrada.',
      occurred_at: lastAt,
    })
  }
  const priority: Record<AttentionKind, number> = { follow_up: 0, next_action: 0, reply: 1, meeting: 2, prototype: 3, waiting: 4, inactive: 5 }
  return result.sort((a, b) => priority[a.kind] - priority[b.kind] || Date.parse(a.occurred_at) - Date.parse(b.occurred_at))
}
