// Partes puras do webhook (sem Deno nem banco), testadas em
// src/utils/webhook.test.mjs.

export const WEBHOOK_EVENTS = ['contact.created', 'deal.created', 'deal.won', 'task.completed'] as const
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number] | 'test'

// Só HTTPS e nunca endereços internos/privados — o servidor não pode ser usado
// para alcançar máquinas de rede interna.
export function checkWebhookUrl(raw: string): string | null {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return 'URL inválida.'
  }
  if (url.protocol !== 'https:') return 'Use uma URL que comece com https://.'
  if (url.username || url.password) return 'A URL não pode ter usuário e senha.'

  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
    return 'Endereços internos não são permitidos.'
  }
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])]
    const privateRange =
      a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224
    if (privateRange) return 'Endereços internos não são permitidos.'
  }
  if (host.includes(':')) {
    if (host === '::1' || host === '::' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80') || host.startsWith('::ffff:')) {
      return 'Endereços internos não são permitidos.'
    }
  }
  return null
}

// Assinatura HMAC-SHA256 do corpo exato enviado, em hexadecimal. O sistema do
// usuário recalcula com o segredo dele e compara com o cabeçalho.
export async function signPayload(secret: string, body: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ])
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function buildPayload(id: string, event: WebhookEvent, data: unknown, createdAt: Date): string {
  return JSON.stringify({ id, event, created_at: createdAt.toISOString(), data })
}
