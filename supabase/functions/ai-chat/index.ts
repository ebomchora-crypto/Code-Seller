// Supabase Edge Function — proxy server-side para a API de IA.
//
// Por que isso existe: platform.experientiallabs.ai (api.experientiallabs.ai)
// não envia cabeçalhos CORS (Access-Control-Allow-Origin), então o navegador
// bloqueia qualquer chamada feita diretamente do frontend (erro visto em
// produção: "blocked by CORS policy"). Chamando a partir de uma Edge
// Function (servidor-a-servidor) o CORS do provedor não se aplica — e como
// bônus a API key (EXPERIENTIAL_API_KEY) deixa de ficar exposta no bundle do
// cliente, que é como estava antes (VITE_EXPERIENTIAL_API_KEY).
//
// Deploy:
//   supabase functions deploy ai-chat
//   supabase secrets set EXPERIENTIAL_API_KEY=xpl_...
//
// verify_jwt fica ligado por padrão (config do projeto) — só usuários
// autenticados do Code Sellers conseguem chamar esta function.

const AI_API_URL = 'https://api.experientiallabs.ai/v1/chat/completions'
const MODEL = 'gpt-6-luna'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('EXPERIENTIAL_API_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'EXPERIENTIAL_API_KEY não configurada nos secrets da function.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { messages } = (await req.json()) as { messages: ChatCompletionMessage[] }
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Campo "messages" ausente ou vazio.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const upstream = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: MODEL, max_tokens: 2000, messages }),
    })

    const body = await upstream.text()
    return new Response(body, {
      status: upstream.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
