import { supabase } from '@/lib/supabaseClient'
import { getContactById } from './contacts'
import { createTask } from './tasks'
import { buildAttentionItems, type AttentionItem } from '@/utils/copilotCRM'
import type { Contact, Interaction, Task, Deal, LeadContext, LeadAnalysis } from '@/types'

async function readAll<T>(table: string, select: string): Promise<T[]> {
  const rows: T[] = []
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase.from(table).select(select).order('id').range(offset, offset + 499)
    if (error) throw new Error(error.message)
    rows.push(...(data as unknown as T[]))
    if (data.length < 500) return rows
  }
}

export async function getCommercialOverview(): Promise<{ items: AttentionItem[]; contacts: Contact[] }> {
  const [contacts, interactions, tasks, deals] = await Promise.all([
    readAll<Contact>('contacts', 'id,name,status,niche,city,state,phone,email,origin,notes,created_at,updated_at,user_id'),
    readAll<Interaction>('interactions', 'id,contact_id,type,direction,metadata,occurred_at'),
    readAll<Task>('tasks', 'id,title,description,status,due_date,kind,followup_step,copilot_key,contact_id,deal_id,created_at'),
    readAll<Deal>('deals', 'id,contact_id'),
  ])
  const contactsByDeal = new Map(deals.map((deal) => [deal.id, deal.contact_id]))
  const linkedTasks = tasks.map((task) => ({ ...task, contact_id: task.contact_id ?? (task.deal_id ? contactsByDeal.get(task.deal_id) ?? null : null) }))
  return { items: buildAttentionItems(contacts, interactions, linkedTasks), contacts }
}

export async function getLeadContext(contactId: string): Promise<LeadContext> {
  const contact = await getContactById(contactId)
  if (!contact) throw new Error('Contato não encontrado.')
  const deals = contact.deals ?? []
  const ids = deals.map((deal) => deal.id)
  const [interactions, tasks, prototypes, activities, proposals, analysis, conversation] = await Promise.all([
    supabase.from('interactions').select('*').eq('contact_id', contactId).order('occurred_at', { ascending: false }).limit(100),
    supabase.from('tasks').select('*').or('contact_id.eq.' + contactId + (ids.length ? ',deal_id.in.(' + ids.join(',') + ')' : '')).is('parent_task_id', null).order('due_date', { ascending: true, nullsFirst: false }),
    supabase.from('sites').select('id,name,slug,status,published,created_at,brief').eq('contact_id', contactId).order('created_at', { ascending: false }).limit(30),
    ids.length ? supabase.from('deal_activities').select('*').in('deal_id', ids).order('occurred_at', { ascending: false }).limit(100) : Promise.resolve({data:[],error:null}),
    ids.length ? supabase.from('online_proposals').select('*').in('deal_id', ids).order('created_at', { ascending: false }).limit(30) : Promise.resolve({data:[],error:null}),
    supabase.from('autopilot_messages').select('analysis,autopilot_conversations!inner(contact_id)').eq('autopilot_conversations.contact_id', contactId).not('analysis', 'is', null).order('created_at', { ascending: false }).limit(1),
    supabase.from('autopilot_conversations').select('commercial_memory').eq('contact_id', contactId).maybeSingle(),
  ])
  for (const result of [interactions, tasks, prototypes, activities, proposals, analysis, conversation]) {
    if (result.error) throw new Error(result.error.message)
  }
  return {
    contact: { ...contact, interactions: undefined, deals: undefined },
    deals, interactions: interactions.data ?? [], tasks: tasks.data ?? [],
    prototypes: prototypes.data ?? [], activities: activities.data ?? [], proposals: proposals.data ?? [],
    previous_analysis: (analysis.data?.[0]?.analysis as LeadAnalysis | null) ?? null,
    commercial_memory: conversation.data?.commercial_memory ?? null,
  }
}

export async function scheduleCommercialTask(input: {
  contactId: string; title: string; kind: NonNullable<Task['kind']>; dueDate: string | null;
  description?: string; dealId?: string | null; sourceKey?: string; done?: boolean;
}): Promise<Task> {
  if (!input.title.trim()) throw new Error('Informe a próxima ação.')
  if (input.dueDate && !Number.isFinite(Date.parse(input.dueDate))) throw new Error('Informe uma data válida.')
  return createTask({
    title: input.title.trim(), description: input.description ?? null,
    kind: input.kind, followup_step: input.kind === 'follow_up' ? 1 : null, copilot_key: input.sourceKey ?? null,
    status: input.done ? 'done' : 'todo', priority: 'medium', due_date: input.dueDate,
    reminder_at: input.done ? null : input.dueDate, contact_id: input.contactId,
    deal_id: input.dealId ?? null, assigned_to: null, recurrence: 'none', recurrence_end_date: null,
    parent_task_id: null, position: 0, completed_at: input.done ? new Date().toISOString() : null,
  })
}
