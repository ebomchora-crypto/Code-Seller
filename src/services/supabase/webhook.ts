import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'

export interface WebhookDelivery {
  id: string
  event: string
  status_code: number | null
  ok: boolean
  error: string | null
  created_at: string
}

export interface WebhookTestResult {
  ok: boolean
  status: number | null
  error: string | null
}

export function generateWebhookSecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24))
  return `whsec_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`
}

export async function listWebhookDeliveries(limit = 8): Promise<WebhookDelivery[]> {
  const { data, error } = await supabase
    .from('webhook_deliveries')
    .select('id, event, status_code, ok, error, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error('Não foi possível carregar os envios.')
  return (data ?? []) as WebhookDelivery[]
}

export async function sendWebhookTest(): Promise<WebhookTestResult> {
  const { data, error } = await supabase.functions.invoke<WebhookTestResult>('webhook-dispatch', {
    body: { action: 'test' },
  })
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const payload = (await error.context.json().catch(() => null)) as { error?: string } | null
      if (payload?.error) throw new Error(payload.error)
    }
    throw new Error('Não foi possível enviar o teste.')
  }
  return data ?? { ok: false, status: null, error: 'Sem resposta.' }
}
