import { supabase } from '@/lib/supabaseClient'
import { startOfDay } from '@/utils/revenuePeriod'

// Dados do bloco "Foco de hoje" do Início: o que pede ação agora.

const STALL_DAYS = 10
const NEW_CONTACT_DAYS = 14
const RECEIVABLE_WINDOW_DAYS = 7
const DAY_MS = 24 * 60 * 60 * 1000

export interface FocusTask {
  id: string
  title: string
  due_date: string
  priority: string
  overdue: boolean
  contact: { id: string; name: string } | null
}

export interface FocusDeal {
  id: string
  title: string
  value: number | null
  contact_name: string | null
  days_stalled: number
}

export interface FocusReceivable {
  id: string
  description: string
  amount: number
  due_date: string
  overdue: boolean
  deal: { id: string; title: string } | null
}

export interface FocusContact {
  id: string
  name: string
  niche: string | null
  created_at: string
}

export interface TodayFocus {
  tasks: FocusTask[]
  stalledDeals: FocusDeal[]
  receivables: FocusReceivable[]
  newContacts: FocusContact[]
}

async function getFocusTasks(now: Date): Promise<FocusTask[]> {
  const todayStart = startOfDay(now)
  const tomorrow = new Date(todayStart.getTime() + DAY_MS)
  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, due_date, priority, status, contact:contacts(id, name)')
    .is('parent_task_id', null)
    .in('status', ['todo', 'in_progress'])
    .lt('due_date', tomorrow.toISOString())
    .order('due_date', { ascending: true })
    .limit(30)

  if (error) throw new Error(error.message)
  return ((data ?? []) as unknown as (Omit<FocusTask, 'overdue'> & { status: string })[])
    .filter((task) => task.due_date && (task.status === 'todo' || task.status === 'in_progress'))
    .map((task) => ({
      id: task.id,
      title: task.title,
      due_date: task.due_date,
      priority: task.priority,
      contact: task.contact,
      overdue: new Date(task.due_date) < todayStart,
    }))
}

async function getStalledDeals(now: Date): Promise<FocusDeal[]> {
  const { data: deals, error } = await supabase
    .from('deals')
    .select('id, title, value, updated_at, status, contact:contacts(name)')
    .eq('status', 'open')

  if (error) throw new Error(error.message)
  const openDeals = ((deals ?? []) as unknown as {
    id: string
    title: string
    value: number | null
    updated_at: string
    status: string
    contact: { name: string } | null
  }[]).filter((deal) => deal.status === 'open')
  if (openDeals.length === 0) return []

  const lastActivity = new Map<string, string>()
  const { data: activities } = await supabase
    .from('deal_activities')
    .select('deal_id, occurred_at')
    .in(
      'deal_id',
      openDeals.map((deal) => deal.id),
    )
    .order('occurred_at', { ascending: false })

  for (const row of (activities ?? []) as { deal_id: string; occurred_at: string }[]) {
    if (!lastActivity.has(row.deal_id)) lastActivity.set(row.deal_id, row.occurred_at)
  }

  return openDeals
    .map((deal) => {
      // Sem atividade registrada, a última edição do negócio vale como sinal.
      const last = new Date(lastActivity.get(deal.id) ?? deal.updated_at)
      return {
        id: deal.id,
        title: deal.title,
        value: deal.value,
        contact_name: deal.contact?.name ?? null,
        days_stalled: Math.floor((now.getTime() - last.getTime()) / DAY_MS),
      }
    })
    .filter((deal) => deal.days_stalled >= STALL_DAYS)
    .sort((a, b) => b.days_stalled - a.days_stalled)
}

async function getDueReceivables(now: Date): Promise<FocusReceivable[]> {
  const todayStart = startOfDay(now)
  const limit = new Date(todayStart.getTime() + RECEIVABLE_WINDOW_DAYS * DAY_MS).toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('receivables')
    .select('id, description, amount, due_date, status, deal:deals(id, title)')
    .in('status', ['pending', 'overdue'])
    .lte('due_date', limit)
    .order('due_date', { ascending: true })

  if (error) throw new Error(error.message)
  return ((data ?? []) as unknown as (Omit<FocusReceivable, 'overdue'> & { status: string })[])
    .filter((row) => row.due_date && row.due_date <= limit && row.status !== 'paid' && row.status !== 'cancelled')
    .map((row) => ({
      id: row.id,
      description: row.description,
      amount: Number(row.amount),
      due_date: row.due_date,
      deal: row.deal,
      overdue: new Date(`${row.due_date}T23:59:59`) < todayStart,
    }))
}

async function getNewContactsWithoutInteraction(now: Date): Promise<FocusContact[]> {
  const since = new Date(now.getTime() - NEW_CONTACT_DAYS * DAY_MS).toISOString()
  const { data, error } = await supabase
    .from('contacts')
    .select('id, name, niche, created_at, interactions(count)')
    .gte('created_at', since)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return ((data ?? []) as unknown as (FocusContact & { interactions?: { count?: number }[] })[])
    .filter((row) => new Date(row.created_at).getTime() >= new Date(since).getTime())
    .filter((row) => {
      const relation = row.interactions ?? []
      const count = relation[0]?.count ?? relation.length
      return count === 0
    })
    .map(({ id, name, niche, created_at }) => ({ id, name, niche, created_at }))
}

export async function getTodayFocus(): Promise<TodayFocus> {
  const now = new Date()
  const [tasks, stalledDeals, receivables, newContacts] = await Promise.all([
    getFocusTasks(now),
    getStalledDeals(now),
    getDueReceivables(now),
    getNewContactsWithoutInteraction(now),
  ])
  return { tasks, stalledDeals, receivables, newContacts }
}
