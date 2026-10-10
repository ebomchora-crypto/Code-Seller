// Supabase Edge Function — assistente de código da IDE instalada.
//
// A IDE no computador não guarda chave de IA nenhuma: ela entra com a conta do Code Sellers e
// chama esta função, que usa a chave guardada no servidor. Só responde para quem tem acesso ao plano.
//
// POST (Authorization: Bearer <sessão do Code Sellers>) { messages, stream? } → texto da IA (SSE)

const NO_ACCESS_MESSAGE = 'Seu teste grátis acabou. Assine o Code Sellers para continuar.'

// Mesma regra de acesso das outras funções do Code Sellers (função usage_for no banco).
async function planUsage(userId: string, email: string | null | undefined): Promise<{ access: boolean }> {
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/rpc/usage_for`, {
    method: 'POST', headers: { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ p_user: userId, p_email: email ?? '' }),
  })
  if (!response.ok) throw new Error(`usage_for ${response.status}`)
  return (await response.json()) as { access: boolean }
}

const AI_URL = 'https://api.experientiallabs.ai/v1/chat/completions'
const MODEL = 'glm-5.3-flash'
const MAX_MESSAGES = 400
const MAX_CHARS = 700_000
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

async function userOf(req: Request): Promise<{ id: string; email: string | null } | null> {
  const authorization = req.headers.get('authorization')
  const url = Deno.env.get('SUPABASE_URL'); const anon = Deno.env.get('SUPABASE_ANON_KEY')
  if (!authorization?.startsWith('Bearer ') || !url || !anon) return null
  const response = await fetch(`${url}/auth/v1/user`, { headers: { authorization, apikey: anon }, signal: AbortSignal.timeout(8000) })
  if (!response.ok) { await response.body?.cancel(); return null }
  const user = (await response.json()) as { id?: string; email?: string }
  return user.id ? { id: user.id, email: user.email ?? null } : null
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Método não permitido.' }, 405)
  try {
    const user = await userOf(req)
    if (!user) return json({ error: 'Entre com a sua conta do Code Sellers para usar o assistente.' }, 401)
    const apiKey = Deno.env.get('EXPERIENTIAL_API_KEY')
    if (!apiKey) return json({ error: 'O assistente ainda não está configurado no servidor.' }, 503)
    const usage = await planUsage(user.id, user.email)
    if (!usage.access) return json({ error: NO_ACCESS_MESSAGE }, 402)
    let body: { messages?: unknown }
    try { body = await req.json() } catch { return json({ error: 'JSON inválido.' }, 400) }
    const list = body.messages
    if (!Array.isArray(list) || !list.length || list.length > MAX_MESSAGES) return json({ error: 'Mensagens inválidas.' }, 400)
    let size = 0
    let imageChars = 0
    const messages = []
    for (const item of list as { role?: unknown; content?: unknown }[]) {
      if (!item || !['system', 'user', 'assistant'].includes(String(item.role))) return json({ error: 'Mensagens inválidas.' }, 400)
      if (typeof item.content === 'string') {
        size += item.content.length
        messages.push({ role: item.role, content: item.content })
        continue
      }
      // Mensagem do usuário com imagens anexadas (texto + imagens em data URL).
      if (item.role !== 'user' || !Array.isArray(item.content) || item.content.length > 6) return json({ error: 'Mensagens inválidas.' }, 400)
      const parts = []
      for (const part of item.content as { type?: unknown; text?: unknown; image_url?: { url?: unknown } }[]) {
        if (part?.type === 'text' && typeof part.text === 'string') { size += part.text.length; parts.push({ type: 'text', text: part.text }); continue }
        const url = part?.type === 'image_url' ? part.image_url?.url : null
        if (typeof url !== 'string' || !/^data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(url) || url.length > 4_500_000) return json({ error: 'Imagem inválida.' }, 400)
        imageChars += url.length
        parts.push({ type: 'image_url', image_url: { url } })
      }
      messages.push({ role: 'user', content: parts })
    }
    if (size > MAX_CHARS || imageChars > 14_000_000) return json({ error: 'Pedido grande demais.' }, 413)
    const upstream = await fetch(AI_URL, {
      method: 'POST', signal: AbortSignal.timeout(170_000),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: MODEL, messages, stream: true, max_tokens: 16000 }),
    })
    if (!upstream.ok || !upstream.body) { await upstream.body?.cancel(); return json({ error: 'A IA não respondeu agora. Tente de novo em instantes.' }, 502) }
    return new Response(upstream.body, { headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store' } })
  } catch {
    return json({ error: 'Algo deu errado ao falar com a IA. Tente de novo.' }, 500)
  }
})
