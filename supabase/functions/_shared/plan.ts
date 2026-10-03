// Plano e uso do dia de uma conta (função usage_for no banco). Usado pelas
// funções do servidor para bloquear quem não tem acesso e aplicar os limites
// diários: teste grátis 2 sites, 10 alterações, 5 mensagens do CS Copilot e 1
// busca de até 10 empresas no Buyers Hunter; plano pago 10 sites, 100 alterações
// e 50 mensagens (Buyers Hunter: 50 buscas no mês, até 30 empresas cada);
// conta liberada sem limite (limite null).

export interface PlanUsage {
  access: boolean
  plan: 'trial' | 'paid' | 'exempt' | 'none'
  state: string
  copilot_used: number
  copilot_limit: number | null
  sites_used: number
  sites_limit: number | null
  hunter_used_today: number
  hunter_daily_limit: number | null
}

export const NO_ACCESS_MESSAGE = 'Seu teste grátis acabou. Assine o Code Sellers para continuar.'

/** Empresas por busca do Buyers Hunter no teste grátis (no plano pago, até 30). */
export const TRIAL_RESULTS_PER_SEARCH = 10

/** Alterações por dia no Code Maker: teste 10, pago 100, conta liberada sem limite (null). */
export function editsLimit(usage: PlanUsage): number | null {
  if (usage.plan === 'exempt') return null
  return usage.plan === 'paid' ? 100 : 10
}

export function editsLimitMessage(usage: PlanUsage): string {
  const limit = editsLimit(usage) ?? 0
  return usage.plan === 'trial'
    ? `No teste grátis dá para fazer ${limit} alterações por dia. Assine para ter 100 por dia, ou volte amanhã.`
    : `Você já fez ${limit} alterações hoje. Amanhã libera de novo.`
}

function rest(path: string, init: RequestInit): Promise<Response> {
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  return fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json', ...(init.headers ?? {}) },
  })
}

export async function planUsage(userId: string, email: string | null | undefined): Promise<PlanUsage> {
  const response = await rest('rpc/usage_for', { method: 'POST', body: JSON.stringify({ p_user: userId, p_email: email ?? '' }) })
  if (!response.ok) throw new Error(`usage_for ${response.status}: ${(await response.text()).slice(0, 200)}`)
  return (await response.json()) as PlanUsage
}

/** Conta uma mensagem do CS Copilot no uso do dia. */
export async function recordCopilotMessage(userId: string): Promise<void> {
  const response = await rest('usage_events', { method: 'POST', headers: { prefer: 'return=minimal' }, body: JSON.stringify({ user_id: userId, kind: 'copilot' }) })
  if (!response.ok) console.error('usage_events', response.status, await response.text())
}

export function copilotLimitMessage(usage: PlanUsage): string {
  return usage.plan === 'trial'
    ? `Você usou as ${usage.copilot_limit} mensagens de hoje do teste grátis. Assine para ter 50 por dia, ou volte amanhã.`
    : `Você usou as ${usage.copilot_limit} mensagens de hoje. Amanhã libera de novo.`
}

export function sitesLimitMessage(usage: PlanUsage): string {
  return usage.plan === 'trial'
    ? `No teste grátis dá para criar ${usage.sites_limit} ${usage.sites_limit === 1 ? 'site' : 'sites'} por dia. Assine para criar até 10 por dia — e dá para continuar alterando o que já existe.`
    : `Você já criou ${usage.sites_limit} sites hoje. Amanhã libera de novo — e dá para alterar os que já existem.`
}

export function hunterDailyLimitMessage(usage: PlanUsage): string {
  const limit = usage.hunter_daily_limit ?? 0
  return `No teste grátis dá para fazer ${limit} ${limit === 1 ? 'busca' : 'buscas'} por dia. Assine para ter 50 buscas por mês, ou volte amanhã.`
}
