import { supabase } from '@/lib/supabaseClient'
import { getContacts } from '@/services/supabase/contacts'
import { getDeals } from '@/services/supabase/deals'
import { getTaskMetrics, getTasks } from '@/services/supabase/tasks'
import { getFinancialMetrics } from '@/services/supabase/financialMetrics'
import type { AutoPilotContext } from '@/types'

const MAX_ITEMS_PER_CATEGORY = 10
const STALL_THRESHOLD_DAYS = 7

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
}

// Monta o snapshot de contexto enviado à IA a cada mensagem. Reaproveita os
// serviços já existentes dos demais módulos (contatos, deals, tarefas,
// financeiro) — só a busca de "última atividade por deal" (para deals
// parados) e "última interação por contato" são consultas novas, pois não
// existia antes uma função que agregasse isso entre múltiplos registros.
export async function buildAutoPilotContext(): Promise<AutoPilotContext> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw new Error(userError.message)
  if (!userData.user) throw new Error('Usuário não autenticado.')

  const [contactsResult, dealsResult, taskMetrics, overdueTasksResult, financialMetrics] = await Promise.all([
    getContacts({ pageSize: MAX_ITEMS_PER_CATEGORY, sortColumn: 'created_at', sortDirection: 'desc' }),
    getDeals({}),
    getTaskMetrics(),
    getTasks({ due: 'overdue' }),
    getFinancialMetrics(),
  ])

  const allDeals = dealsResult.data
  const openDeals = allDeals.filter((deal) => deal.status === 'open')
  const resolvedDeals = allDeals.filter((deal) => deal.status === 'won' || deal.status === 'lost')
  const wonDeals = resolvedDeals.filter((deal) => deal.status === 'won')
  const conversionRate = resolvedDeals.length > 0 ? (wonDeals.length / resolvedDeals.length) * 100 : 0
  const pipelineValue = openDeals.reduce((sum, deal) => sum + (deal.value ?? 0), 0)

  // Última interação por contato (para os contatos recentes exibidos no contexto)
  const contactIds = contactsResult.data.map((contact) => contact.id)
  const lastInteractionByContact = new Map<string, string>()
  if (contactIds.length > 0) {
    const { data: interactions } = await supabase
      .from('interactions')
      .select('contact_id, occurred_at')
      .in('contact_id', contactIds)
      .order('occurred_at', { ascending: false })

    for (const row of interactions ?? []) {
      if (!lastInteractionByContact.has(row.contact_id)) {
        lastInteractionByContact.set(row.contact_id, row.occurred_at)
      }
    }
  }

  // Última atividade por deal aberto (para identificar deals parados)
  const openDealIds = openDeals.map((deal) => deal.id)
  const lastActivityByDeal = new Map<string, string>()
  if (openDealIds.length > 0) {
    const { data: activities } = await supabase
      .from('deal_activities')
      .select('deal_id, created_at')
      .in('deal_id', openDealIds)
      .order('created_at', { ascending: false })

    for (const row of activities ?? []) {
      if (!lastActivityByDeal.has(row.deal_id)) {
        lastActivityByDeal.set(row.deal_id, row.created_at)
      }
    }
  }

  const stalledDeals = openDeals
    .map((deal) => {
      // Deals sem nenhuma deal_activity registrada usam updated_at como proxy
      // de última atividade (a própria criação/edição do deal já é um sinal).
      const lastActivityAt = lastActivityByDeal.get(deal.id) ?? deal.updated_at
      const daysStalled = daysSince(new Date(lastActivityAt))
      return { deal, lastActivityAt, daysStalled }
    })
    .filter(({ daysStalled }) => daysStalled > STALL_THRESHOLD_DAYS)
    .sort((a, b) => b.daysStalled - a.daysStalled)
    .slice(0, MAX_ITEMS_PER_CATEGORY)
    .map(({ deal, lastActivityAt, daysStalled }) => ({
      id: deal.id,
      title: deal.title,
      contact_name: deal.contact?.name ?? null,
      stage: deal.stage,
      value: deal.value,
      last_activity_at: lastActivityAt,
      days_stalled: daysStalled,
    }))

  return {
    user: {
      name: (userData.user.user_metadata?.name as string | undefined) ?? userData.user.email ?? 'Usuário',
      email: userData.user.email ?? '',
    },
    summary: {
      total_contacts: contactsResult.count,
      active_deals: openDeals.length,
      pipeline_value: pipelineValue,
      conversion_rate: Math.round(conversionRate * 10) / 10,
      pending_tasks: taskMetrics.pending,
      overdue_tasks: taskMetrics.overdue,
      monthly_income: financialMetrics.income_month,
      monthly_expense: financialMetrics.expense_month,
      receivables_total: financialMetrics.receivables_total,
    },
    recent_contacts: contactsResult.data.slice(0, MAX_ITEMS_PER_CATEGORY).map((contact) => ({
      id: contact.id,
      name: contact.name,
      status: contact.status,
      niche: contact.niche,
      last_interaction: lastInteractionByContact.get(contact.id) ?? null,
    })),
    active_deals: openDeals.slice(0, MAX_ITEMS_PER_CATEGORY).map((deal) => ({
      id: deal.id,
      title: deal.title,
      contact_name: deal.contact?.name ?? null,
      stage: deal.stage,
      value: deal.value,
      expected_close_date: deal.expected_close_date,
      days_in_stage: daysSince(new Date(deal.updated_at)),
    })),
    overdue_tasks: overdueTasksResult.slice(0, MAX_ITEMS_PER_CATEGORY).map((task) => ({
      id: task.id,
      title: task.title,
      priority: task.priority,
      due_date: task.due_date ?? '',
      contact_name: task.contact?.name ?? null,
      deal_title: task.deal?.title ?? null,
    })),
    stalled_deals: stalledDeals,
  }
}
