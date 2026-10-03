// Plano e uso do dia de uma conta (função usage_for no banco). Usado pelas
// funções do servidor para bloquear quem não tem acesso e aplicar os limites
// diários: teste grátis 1 site e 3 mensagens do CS Copilot; plano pago 10 sites
// e 50 mensagens; conta liberada sem limite (limite null).

export interface PlanUsage {
  access: boolean
  plan: 'trial' | 'paid' | 'exempt' | 'none'
  state: string
  copilot_used: number
  copilot_limit: number | null
  sites_used: number
  sites_limit: number | null
}

export const NO_ACCESS_MESSAGE = 'Seu teste grátis acabou. Assine o Code Sellers para continuar.'

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
    ? `No teste grátis dá para criar ${usage.sites_limit} site por dia. Assine para criar até 10 por dia — e dá para continuar alterando o que já existe.`
    : `Você já criou ${usage.sites_limit} sites hoje. Amanhã libera de novo — e dá para alterar os que já existem.`
}
