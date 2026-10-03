// Supabase Edge Function — avisos de pagamento da Kiwify (assinatura).
//
// A Kiwify chama esta URL quando uma compra é aprovada, a assinatura renova,
// atrasa, é cancelada, reembolsada ou sofre chargeback. Cada aviso é guardado em
// billing_events e a situação do e-mail do comprador é atualizada em
// subscriptions (a tela libera ou pede a assinatura com billing_status()).
//
// Segurança: a Kiwify assina o corpo com o token do webhook (HMAC-SHA1 no
// parâmetro ?signature=). O token fica só no servidor: secret KIWIFY_WEBHOOK_TOKEN
// ou a linha 'kiwify_webhook_token' da tabela app_config.
//
// Deploy: supabase functions deploy kiwify-webhook --no-verify-jwt

import { createClient } from 'jsr:@supabase/supabase-js@2'

type Status = 'active' | 'late' | 'canceled' | 'refunded'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

async function hmacSha1Hex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let index = 0; index < a.length; index++) diff |= a.charCodeAt(index) ^ b.charCodeAt(index)
  return diff === 0
}

// deno-lint-ignore no-explicit-any
type Payload = Record<string, any>

function pick(payload: Payload, ...paths: string[]): unknown {
  for (const path of paths) {
    let value: unknown = payload
    for (const key of path.split('.')) value = value && typeof value === 'object' ? (value as Payload)[key] : undefined
    if (value !== undefined && value !== null && value !== '') return value
  }
  return undefined
}

function eventName(payload: Payload): string {
  return String(pick(payload, 'webhook_event_type', 'event', 'trigger', 'type') ?? '').toLowerCase()
}

// O que o aviso significa para a assinatura (null: só registra).
function statusFor(event: string, payload: Payload): Status | null {
  const order = String(pick(payload, 'order_status', 'status') ?? '').toLowerCase()
  if (['order_refunded', 'compra_reembolsada', 'refunded', 'chargeback', 'chargedback'].includes(event)) return 'refunded'
  if (['refunded', 'chargedback'].includes(order)) return 'refunded'
  if (['subscription_canceled', 'subscription_cancelled'].includes(event)) return 'canceled'
  if (['subscription_late'].includes(event)) return 'late'
  if (['order_approved', 'compra_aprovada', 'subscription_renewed'].includes(event)) return 'active'
  if (order === 'paid' && !event.includes('refus') && !event.includes('recusad')) return 'active'
  return null
}

function toDate(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? date.toISOString() : null
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ ok: true })

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const raw = await req.text()
  let payload: Payload = {}
  try {
    payload = JSON.parse(raw)
  } catch {
    return json({ error: 'invalid_json' }, 400)
  }

  const event = eventName(payload)
  const email = String(pick(payload, 'Customer.email', 'customer.email', 'buyer.email', 'email') ?? '').trim().toLowerCase() || null

  let token = Deno.env.get('KIWIFY_WEBHOOK_TOKEN')
  if (!token) {
    const { data } = await admin.from('app_config').select('value').eq('key', 'kiwify_webhook_token').maybeSingle()
    token = data?.value ?? undefined
  }
  const signature = new URL(req.url).searchParams.get('signature')?.toLowerCase() ?? ''
  const verified = Boolean(token && signature && safeEqual(signature, await hmacSha1Hex(token, raw)))

  const log = async (applied: boolean, note: string) => {
    await admin.from('billing_events').insert({ event, email, verified, applied, note, payload })
  }

  if (!verified) {
    await log(false, token ? 'assinatura do aviso não confere' : 'token não configurado')
    return json({ error: 'invalid_signature' }, 401)
  }

  const status = statusFor(event, payload)
  if (!status || !email) {
    await log(false, !email ? 'aviso sem e-mail do comprador' : 'evento só registrado')
    return json({ ok: true })
  }

  const nextCharge = toDate(pick(payload, 'Subscription.next_payment', 'subscription.next_payment', 'next_payment'))
  const row: Payload = {
    email,
    status,
    last_event: event,
    updated_at: new Date().toISOString(),
    kiwify_subscription_id: pick(payload, 'subscription_id', 'Subscription.id') ?? null,
    kiwify_order_id: pick(payload, 'order_id') ?? null,
  }
  if (nextCharge) row.next_charge_at = nextCharge
  if (row.kiwify_subscription_id === null) delete row.kiwify_subscription_id

  const { error } = await admin.from('subscriptions').upsert(row, { onConflict: 'email' })
  if (error) {
    await log(false, `erro ao salvar: ${error.message}`)
    return json({ error: 'save_failed' }, 500)
  }
  await log(true, `assinatura: ${status}`)
  return json({ ok: true })
})
