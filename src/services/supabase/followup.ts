import { supabase } from '@/lib/supabaseClient'
import { getTemplates } from '@/services/supabase/templates'
import { getMyPublishedPortfolioLink } from '@/services/supabase/portfolio'
import { DEFAULT_FOLLOWUP_DAYS, followUpDates } from '@/utils/followup'
import { fillTemplate } from '@/utils/templates'

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
        'Abra o contato e use "Mensagem pronta" para enviar pelo WhatsApp.',
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
