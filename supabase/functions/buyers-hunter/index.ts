// Supabase Edge Function — busca de empresas do Buyers Hunter.
//
// O provedor dos dados é configurado só aqui (servidor): a tela nunca sabe
// de onde vêm as empresas, e o token nunca chega ao navegador.
//
// Provedor: Apify (ator "Google Maps Scraper" — compass/crawler-google-places).
//
// Deploy:
//   supabase functions deploy buyers-hunter
//   supabase secrets set BUYERS_HUNTER_APIFY_TOKEN=apify_api_...
//   supabase secrets set BUYERS_HUNTER_MONTHLY_LIMIT=50   (opcional, padrão 50)
// Alternativa aos secrets: linhas 'buyers_hunter_apify_token' e
// 'buyers_hunter_monthly_limit' na tabela public.app_config (só o servidor lê).
//
// Ações (POST com JSON):
//   { action: 'usage' }                                  → { configured, used, limit }
//   { action: 'search', niche, city, offer?, pageToken? } → { results, nextPageToken, usage }
//
// Cada chamada de busca (inclusive "carregar mais") conta 1 no limite mensal.
// Os resultados não são gravados: só o histórico da busca (prospect_searches).
//
// Paginação: como o ator não tem cursor, "carregar mais" roda a busca de novo
// pedindo um lote maior (o pageToken guarda quantos lugares já foram pedidos).
// O app descarta duplicados pelo id, então repetir itens já vistos é inofensivo.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const APIFY_RUN_URL = 'https://api.apify.com/v2/acts/compass~crawler-google-places/run-sync-get-dataset-items?memory=1024'
const PAGE_SIZE = 20
const MAX_TOTAL_RESULTS = 60 // ~3 páginas — trava o custo de uma única busca

const DEFAULT_MONTHLY_LIMIT = 50

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type WebsiteKind = 'none' | 'social' | 'site'

interface ProspectResult {
  id: string
  name: string
  category: string | null
  address: string | null
  city: string | null
  state: string | null
  phone: string | null
  phone_international: string | null
  website: string | null
  website_kind: WebsiteKind
  rating: number | null
  reviews: number
  maps_url: string | null
}

// Formato do ator compass/crawler-google-places (Apify).
interface ApifyPlace {
  placeId: string
  title?: string
  categoryName?: string
  address?: string
  city?: string
  state?: string
  website?: string
  phone?: string
  phoneUnformatted?: string
  totalScore?: number
  reviewsCount?: number
  url?: string
  permanentlyClosed?: boolean
  temporarilyClosed?: boolean
}

const SOCIAL_HOSTS = [
  'instagram.com',
  'facebook.com',
  'fb.com',
  'linktr.ee',
  'wa.me',
  'whatsapp.com',
  'api.whatsapp.com',
  'tiktok.com',
  'linkedin.com',
  'ifood.com.br',
  'goo.gl',
  'g.page',
  'business.site',
]

function classifyWebsite(url: string | undefined): WebsiteKind {
  if (!url) return 'none'
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    return SOCIAL_HOSTS.some((social) => host === social || host.endsWith(`.${social}`)) ? 'social' : 'site'
  } catch {
    return 'site'
  }
}

function normalize(place: ApifyPlace): ProspectResult {
  return {
    id: place.placeId,
    name: place.title ?? 'Empresa sem nome',
    category: place.categoryName ?? null,
    address: place.address ?? null,
    city: place.city ?? null,
    state: place.state ?? null,
    phone: place.phone ?? null,
    phone_international: place.phoneUnformatted ?? null,
    website: place.website ?? null,
    website_kind: classifyWebsite(place.website),
    rating: place.totalScore ?? null,
    reviews: place.reviewsCount ?? 0,
    maps_url: place.url ?? null,
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function fail(code: string, message: string, status: number) {
  return json({ error: { code, message } }, status)
}

function monthStartIso(): string {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const admin = createClient(supabaseUrl, serviceKey)
    const { data: configRows } = await admin
      .from('app_config')
      .select('key, value')
      .in('key', ['buyers_hunter_apify_token', 'buyers_hunter_monthly_limit'])
    const config = new Map((configRows ?? []).map((row) => [row.key as string, row.value as string]))
    const apifyToken = Deno.env.get('BUYERS_HUNTER_APIFY_TOKEN') ?? config.get('buyers_hunter_apify_token')
    const limit =
      Number(Deno.env.get('BUYERS_HUNTER_MONTHLY_LIMIT') ?? config.get('buyers_hunter_monthly_limit')) || DEFAULT_MONTHLY_LIMIT

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    })
    const { data: userData, error: userError } = await userClient.auth.getUser()
    if (userError || !userData.user) return fail('unauthorized', 'Sessão expirada. Entre novamente.', 401)
    const userId = userData.user.id

    const { count, error: countError } = await admin
      .from('prospect_searches')
      .select('id', { count: 'exact' })
      .limit(1)
      .eq('user_id', userId)
      .gte('created_at', monthStartIso())
    if (countError) throw new Error(countError.message)
    const used = count ?? 0

    const body = (await req.json().catch(() => ({}))) as {
      action?: string
      niche?: string
      city?: string
      offer?: string
      pageToken?: string
    }

    if (body.action === 'usage') {
      return json({ configured: Boolean(apifyToken), used, limit })
    }

    if (body.action !== 'search') return fail('invalid_input', 'Ação inválida.', 400)
    if (!apifyToken) return fail('not_configured', 'A busca ainda não está disponível.', 503)

    const niche = body.niche?.trim().slice(0, 80) ?? ''
    const city = body.city?.trim().slice(0, 80) ?? ''
    if (niche.length < 2 || city.length < 2) {
      return fail('invalid_input', 'Informe o nicho e a cidade.', 400)
    }
    if (used >= limit) {
      return fail('limit_reached', `Você usou as ${limit} buscas deste mês. O limite renova no dia 1º.`, 429)
    }

    // Sem cursor real: "carregar mais" pede um lote maior desde o início.
    // pageToken guarda quantos lugares o lote anterior já tinha.
    const already = Math.max(0, Math.min(Number(body.pageToken) || 0, MAX_TOTAL_RESULTS))
    const wanted = Math.min(already + PAGE_SIZE, MAX_TOTAL_RESULTS)

    const upstream = await fetch(APIFY_RUN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apifyToken}`,
      },
      body: JSON.stringify({
        searchStringsArray: [niche],
        locationQuery: `${city}, Brazil`,
        language: 'pt-BR',
        maxCrawledPlacesPerSearch: wanted,
        skipClosedPlaces: true,
      }),
    })

    if (!upstream.ok) {
      console.error('buyers-hunter upstream', upstream.status, await upstream.text())
      return fail('upstream_error', 'Não foi possível buscar empresas agora. Tente de novo em instantes.', 502)
    }

    const payload = (await upstream.json()) as ApifyPlace[]
    const results = payload.filter((place) => !place.permanentlyClosed && !place.temporarilyClosed).map(normalize)

    const { error: insertError } = await admin.from('prospect_searches').insert({
      user_id: userId,
      niche,
      city,
      offer: body.offer ?? null,
      results_count: results.length,
    })
    if (insertError) console.error('buyers-hunter insert', insertError.message)

    // Só oferece "carregar mais" se o lote voltou cheio (sinal de que pode haver mais) e ainda não bateu o teto.
    const nextPageToken = results.length >= wanted && wanted < MAX_TOTAL_RESULTS ? String(wanted) : null

    return json({
      results,
      nextPageToken,
      usage: { configured: true, used: used + 1, limit },
    })
  } catch (error) {
    console.error('buyers-hunter', error)
    return fail('internal', 'Erro inesperado na busca. Tente de novo.', 500)
  }
})
