import { supabase } from '@/lib/supabaseClient'
import { getTemplates } from '@/services/supabase/templates'
import { getMyPublishedPortfolioLink } from '@/services/supabase/portfolio'
import { DEFAULT_FOLLOWUP_DAYS, followUpDates } from '@/utils/followup'
import { fillTemplate } from '@/utils/templates'
import { buildFirstMessage, type FirstMessageOffer, type FirstMessageWebsite } from '@/utils/firstMessage'

export interface FollowUpTarget {
  contact: { id: string; name: string; city?: string | null; niche?: string | null }
  deal?: { id: string; title: string; value: number | null } | null
}

interface FollowUpSettings {
  enabled: boolean
  days: number[]
}

export async function getFollowUpSettings(): Promise<FollowUpSettings> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { enabled: false, days: DEFAULT_FOLLOWUP_DAYS }
  const { data, error } = await supabase
    .from('user_profiles')
    .select('followup_enabled, followup_days, full_name, company_name')
    .eq('id', userData.user.id)
    .maybeSingle()
  // Sem a migração 0015 as colunas não existem: usa o padrão.
  if (error || !data) return { enabled: true, days: DEFAULT_FOLLOWUP_DAYS }
  return {
    enabled: data.followup_enabled !== false,
    days: Array.isArray(data.followup_days) && data.followup_days.length > 0 ? data.followup_days : DEFAULT_FOLLOWUP_DAYS,
  }
}

// Cria as tarefas de retorno (com lembrete) para um contato/negócio. Não
// duplica: se já houver follow-up em aberto para o contato, não cria outro.
// `force` ignora a chave "ligado/desligado" (botão manual no contato).
export async function startFollowUp(target: FollowUpTarget, options: { force?: boolean } = {}): Promise<number> {
  const settings = await getFollowUpSettings()
  if (!settings.enabled && !options.force) return 0

  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return 0
  const userId = userData.user.id

  const { data: open } = await supabase
    .from('tasks')
    .select('id')
    .eq('contact_id', target.contact.id)
    .not('followup_step', 'is', null)
    .in('status', ['todo', 'in_progress'])
    .limit(1)
  if (open && open.length > 0) return 0

  const [{ data: profile }, templates, portfolio] = await Promise.all([
    supabase.from('user_profiles').select('full_name, company_name').eq('id', userId).maybeSingle(),
    getTemplates().catch(() => []),
    getMyPublishedPortfolioLink(),
  ])
  const followUps = templates.filter((template) => template.category === 'follow_up')
  const context = {
    nome: target.contact.name,
    cidade: target.contact.city,
    nicho: target.contact.niche,
    negocio: target.deal?.title,
    valor: target.deal?.value,
    meu_nome: profile?.full_name,
    minha_empresa: profile?.company_name,
    portfolio,
  }

  const dates = followUpDates(settings.days)
  const rows = dates.map((date, index) => {
    const template = followUps[Math.min(index, followUps.length - 1)]
    const suggestion = template ? fillTemplate(template.body, context) : null
    const isLast = index === dates.length - 1
    return {
      user_id: userId,
      title: `${isLast && dates.length > 1 ? 'Último follow-up' : `Follow-up ${index + 1}`} · ${target.contact.name}`,
      description: [
        suggestion ? `Mensagem sugerida:\n${suggestion}` : null,
        'Abra a tarefa e toque em "Enviar no WhatsApp".',
      ]
        .filter(Boolean)
        .join('\n\n'),
      status: 'todo',
      priority: 'medium',
      due_date: date.toISOString(),
      reminder_at: date.toISOString(),
      contact_id: target.contact.id,
      deal_id: target.deal?.id ?? null,
      recurrence: 'none',
      position: 0,
      followup_step: index + 1,
    }
  })
  if (rows.length === 0) return 0

  const { error } = await supabase.from('tasks').insert(rows)
  if (error) throw new Error(error.message)
  return rows.length
}

// Cancela os follow-ups em aberto de um contato (botão "Parar follow-up").
export async function stopFollowUp(contactId: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ status: 'cancelled' })
    .eq('contact_id', contactId)
    .not('followup_step', 'is', null)
    .in('status', ['todo', 'in_progress'])
  if (error) throw new Error(error.message)
}

export async function hasOpenFollowUp(contactId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('tasks')
    .select('id')
    .eq('contact_id', contactId)
    .not('followup_step', 'is', null)
    .in('status', ['todo', 'in_progress'])
    .limit(1)
  if (error) return false
  return (data ?? []).length > 0
}

// ---- Buyers Hunter: primeira mensagem + follow-up, para várias empresas de uma vez ----

export interface ProspectingTarget {
  contact: { id: string; name: string; city?: string | null; niche?: string | null }
  websiteKind?: FirstMessageWebsite | null
  rating?: number | null
  reviews?: number | null
}

// Primeira mensagem: hoje, daqui a pouco (ou amanhã às 10h, se já passou das 19h).
export function firstContactTime(now = new Date()): Date {
  if (now.getHours() >= 19) return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 10, 0, 0)
  if (now.getHours() < 9) return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0)
  return new Date(now.getTime() + 15 * 60 * 1000)
}

// Cria, para cada empresa, a tarefa "Primeira mensagem" (com o texto pronto
// para o nicho dela) e a sequência de follow-up — tudo num envio só.
// Empresas que já têm sequência em aberto são puladas.
export async function startProspecting(
  targets: ProspectingTarget[],
  offer: FirstMessageOffer,
): Promise<{ contacts: number; tasks: number }> {
  if (targets.length === 0) return { contacts: 0, tasks: 0 }
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { contacts: 0, tasks: 0 }
  const userId = userData.user.id

  const ids = targets.map((target) => target.contact.id)
  const [settings, { data: open }, { data: profile }, templates, portfolio] = await Promise.all([
    getFollowUpSettings(),
    supabase
      .from('tasks')
      .select('contact_id')
      .in('contact_id', ids)
      .not('followup_step', 'is', null)
      .in('status', ['todo', 'in_progress']),
    supabase.from('user_profiles').select('full_name, company_name').eq('id', userId).maybeSingle(),
    getTemplates().catch(() => []),
    getMyPublishedPortfolioLink(),
  ])
  const busy = new Set((open ?? []).map((row: { contact_id: string }) => row.contact_id))
  const followUps = templates.filter((template) => template.category === 'follow_up')
  const first = firstContactTime()
  const dates = settings.enabled ? followUpDates(settings.days) : []

  const rows: Record<string, unknown>[] = []
  let contacts = 0
  for (const target of targets) {
    if (busy.has(target.contact.id)) continue
    contacts++
    const message = buildFirstMessage({
      businessName: target.contact.name,
      niche: target.contact.niche,
      city: target.contact.city,
      websiteKind: target.websiteKind,
      rating: target.rating,
      reviews: target.reviews,
      offer,
      myName: profile?.full_name,
      myCompany: profile?.company_name,
    })
    rows.push({
      user_id: userId,
      title: `Primeira mensagem · ${target.contact.name}`,
      description: `Mensagem pronta:\n${message}\n\nAbra a tarefa e toque em "Enviar no WhatsApp".`,
      status: 'todo',
      priority: 'high',
      due_date: first.toISOString(),
      reminder_at: first.toISOString(),
      contact_id: target.contact.id,
      deal_id: null,
      recurrence: 'none',
      position: 0,
      followup_step: 0,
    })

    const context = {
      nome: target.contact.name,
      cidade: target.contact.city,
      nicho: target.contact.niche,
      meu_nome: profile?.full_name,
      minha_empresa: profile?.company_name,
      portfolio,
    }
    dates.forEach((date, index) => {
      const template = followUps[Math.min(index, followUps.length - 1)]
      const suggestion = template ? fillTemplate(template.body, context) : null
      const isLast = index === dates.length - 1
      rows.push({
        user_id: userId,
        title: `${isLast && dates.length > 1 ? 'Último follow-up' : `Follow-up ${index + 1}`} · ${target.contact.name}`,
        description: [
          suggestion ? `Mensagem sugerida:\n${suggestion}` : null,
          'Abra a tarefa e toque em "Enviar no WhatsApp".',
        ]
          .filter(Boolean)
          .join('\n\n'),
        status: 'todo',
        priority: 'medium',
        due_date: date.toISOString(),
        reminder_at: date.toISOString(),
        contact_id: target.contact.id,
        deal_id: null,
        recurrence: 'none',
        position: 0,
        followup_step: index + 1,
      })
    })
  }

  if (rows.length > 0) {
    const { error } = await supabase.from('tasks').insert(rows)
    if (error) throw new Error(error.message)
  }
  return { contacts, tasks: rows.length }
}
