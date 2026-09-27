// Supabase Edge Function — Webhook do usuário.
//
//   { action: 'deliver', user_id, event, record_id } → chamada pelo banco
//     (triggers da migração 0024, header x-cron-secret) quando algo acontece.
//   { action: 'test' } → usuário logado; manda um evento de teste para a URL salva.
//
// Cada envio é um POST JSON { id, event, created_at, data } assinado com
// HMAC-SHA256 do corpo (header X-CodeSellers-Signature: sha256=<hex>) e fica
// registrado em webhook_deliveries.
//
// Deploy: supabase functions deploy webhook-dispatch --no-verify-jwt

import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'
import { WEBHOOK_EVENTS, buildPayload, checkWebhookUrl, signPayload, type WebhookEvent } from './webhook.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TIMEOUT_MS = 10_000

type WebhookConfig = { url?: string; secret?: string; events?: string[] }

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

async function loadWebhook(admin: SupabaseClient, userId: string): Promise<WebhookConfig | null> {
  const { data } = await admin
    .from('integrations')
    .select('config')
    .eq('user_id', userId)
    .eq('type', 'webhook')
    .eq('status', 'connected')
    .maybeSingle()
  return (data?.config as WebhookConfig | null) ?? null
}

async function loadEventData(admin: SupabaseClient, userId: string, event: WebhookEvent, recordId: string) {
  if (event === 'contact.created') {
    const { data } = await admin
      .from('contacts')
      .select('id, name, email, phone, niche, city, state, status, origin, created_at')
      .eq('id', recordId)
      .eq('user_id', userId)
      .maybeSingle()
    return data ? { contact: data } : null
  }
  if (event === 'deal.created' || event === 'deal.won') {
    const { data } = await admin
      .from('deals')
      .select(
        'id, title, value, status, stage, service, expected_close_date, won_at, created_at, contact:contacts(id, name, email, phone)',
      )
      .eq('id', recordId)
      .eq('user_id', userId)
      .maybeSingle()
    return data ? { deal: data } : null
  }
  if (event === 'task.completed') {
    const { data } = await admin
      .from('tasks')
      .select('id, title, description, priority, due_date, completed_at, contact:contacts(id, name), deal:deals(id, title)')
      .eq('id', recordId)
      .eq('user_id', userId)
      .maybeSingle()
    return data ? { task: data } : null
  }
  return null
}

// Envia, registra e devolve o resultado. Nunca lança erro.
async function deliver(
  admin: SupabaseClient,
  userId: string,
  config: WebhookConfig,
  event: WebhookEvent,
  data: unknown,
): Promise<{ ok: boolean; status: number | null; error: string | null }> {
  let result: { ok: boolean; status: number | null; error: string | null }
  const urlError = checkWebhookUrl(config.url ?? '')

  if (urlError) {
    result = { ok: false, status: null, error: urlError }
  } else {
    const deliveryId = crypto.randomUUID()
    const body = buildPayload(deliveryId, event, data, new Date())
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'CodeSellers-Webhook/1.0',
      'X-CodeSellers-Event': event,
      'X-CodeSellers-Delivery': deliveryId,
    }
    if (config.secret) headers['X-CodeSellers-Signature'] = `sha256=${await signPayload(config.secret, body)}`

    try {
      const response = await fetch(config.url!, {
        method: 'POST',
        headers,
        body,
        redirect: 'manual',
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
      await response.body?.cancel()
      const ok = response.status >= 200 && response.status < 300
      result = { ok, status: response.status, error: ok ? null : `O endereço respondeu ${response.status}.` }
    } catch (error) {
      const timedOut = error instanceof DOMException && error.name === 'TimeoutError'
      result = {
        ok: false,
        status: null,
        error: timedOut ? 'O endereço demorou mais de 10 segundos para responder.' : 'Não foi possível conectar ao endereço.',
      }
    }
  }

  await admin.from('webhook_deliveries').insert({
    user_id: userId,
    event,
    status_code: result.status,
    ok: result.ok,
    error: result.error,
  })
  return result
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Método não permitido.' }, 405)

  try {
    const body = (await req.json().catch(() => ({}))) as {
      action?: string
      user_id?: string
      event?: string
      record_id?: string
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
      auth: { persistSession: false },
    })

    if (body.action === 'test') {
      const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
      })
      const { data: userData } = await userClient.auth.getUser()
      if (!userData.user) return json({ error: 'Sessão expirada. Entre novamente.' }, 401)

      const config = await loadWebhook(admin, userData.user.id)
      if (!config?.url) return json({ error: 'Conecte o webhook antes de testar.' }, 400)

      const result = await deliver(admin, userData.user.id, config, 'test', {
        message: 'Teste do Code Sellers. Se chegou aqui, o webhook está funcionando.',
      })
      return json(result)
    }

    if (body.action === 'deliver') {
      const { data: secretRow } = await admin.from('app_config').select('value').eq('key', 'cron_secret').maybeSingle()
      const cronSecret = Deno.env.get('CRON_SECRET') ?? (secretRow?.value as string | undefined)
      if (!cronSecret || req.headers.get('x-cron-secret') !== cronSecret) {
        return json({ error: 'Não autorizado.' }, 401)
      }

      const { user_id: userId, event, record_id: recordId } = body
      if (!userId || !recordId || !(WEBHOOK_EVENTS as readonly string[]).includes(event ?? '')) {
        return json({ error: 'Dados inválidos.' }, 400)
      }

      const config = await loadWebhook(admin, userId)
      if (!config?.url || !config.events?.includes(event!)) return json({ skipped: true })

      const data = await loadEventData(admin, userId, event as WebhookEvent, recordId)
      if (!data) return json({ skipped: true })

      return json(await deliver(admin, userId, config, event as WebhookEvent, data))
    }

    return json({ error: 'Ação inválida.' }, 400)
  } catch (error) {
    console.error('webhook-dispatch', error)
    return json({ error: 'Erro inesperado.' }, 500)
  }
})
