// Supabase Edge Function — busca de empresas do Buyers Hunter.
//
// O provedor dos dados é configurado só aqui (servidor): a tela nunca sabe
// de onde vêm as empresas, e a chave nunca chega ao navegador.
//
// Deploy:
//   supabase functions deploy buyers-hunter
//   supabase secrets set BUYERS_HUNTER_PLACES_KEY=...
//   supabase secrets set BUYERS_HUNTER_MONTHLY_LIMIT=50   (opcional, padrão 50)
//
// Ações (POST com JSON):
//   { action: 'usage' }                                  → { configured, used, limit }
//   { action: 'search', niche, city, offer?, pageToken? } → { results, nextPageToken, usage }
//
// Cada chamada de busca (inclusive "carregar mais") conta 1 no limite mensal.
// Os resultados não são gravados: só o histórico da busca (prospect_searches).

import { createClient } from 'jsr:@supabase/supabase-js@2'

const SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText'
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.addressComponents',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.websiteUri',
  'places.rating',
  'places.userRatingCount',
  'places.primaryTypeDisplayName',
  'places.googleMapsUri',
  'places.businessStatus',
  'nextPageToken',
].join(',')

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

interface RawPlace {
  id: string
  displayName?: { text?: string }
  formattedAddress?: string
  addressComponents?: { longText?: string; shortText?: string; types?: string[] }[]
  nationalPhoneNumber?: string
  internationalPhoneNumber?: string
  websiteUri?: string
  rating?: number
  userRatingCount?: number
  primaryTypeDisplayName?: { text?: string }
  googleMapsUri?: string
  businessStatus?: string
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

function findComponent(place: RawPlace, type: string, short = false): string | null {
  const component = place.addressComponents?.find((entry) => entry.types?.includes(type))
  if (!component) return null
  return (short ? component.shortText : component.longText) ?? null
}

function normalize(place: RawPlace): ProspectResult {
  return {
    id: place.id,
    name: place.displayName?.text ?? 'Empresa sem nome',
    category: place.primaryTypeDisplayName?.text ?? null,
    address: place.formattedAddress ?? null,
    city: findComponent(place, 'administrative_area_level_2'),
    state: findComponent(place, 'administrative_area_level_1', true),
    phone: place.nationalPhoneNumber ?? null,
    phone_international: place.internationalPhoneNumber ?? null,
    website: place.websiteUri ?? null,
    website_kind: classifyWebsite(place.websiteUri),
    rating: place.rating ?? null,
    reviews: place.userRatingCount ?? 0,
    maps_url: place.googleMapsUri ?? null,
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
    const placesKey = Deno.env.get('BUYERS_HUNTER_PLACES_KEY')
    const limit = Number(Deno.env.get('BUYERS_HUNTER_MONTHLY_LIMIT')) || DEFAULT_MONTHLY_LIMIT

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    })
    const { data: userData, error: userError } = await userClient.auth.getUser()
    if (userError || !userData.user) return fail('unauthorized', 'Sessão expirada. Entre novamente.', 401)
    const userId = userData.user.id

    const admin = createClient(supabaseUrl, serviceKey)
    const { count, error: countError } = await admin
      .from('prospect_searches')
      .select('id', { count: 'exact', head: true })
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
      return json({ configured: Boolean(placesKey), used, limit })
    }

    if (body.action !== 'search') return fail('invalid_input', 'Ação inválida.', 400)
    if (!placesKey) return fail('not_configured', 'A busca ainda não está disponível.', 503)

    const niche = body.niche?.trim().slice(0, 80) ?? ''
    const city = body.city?.trim().slice(0, 80) ?? ''
    if (niche.length < 2 || city.length < 2) {
      return fail('invalid_input', 'Informe o nicho e a cidade.', 400)
    }
    if (used >= limit) {
      return fail('limit_reached', `Você usou as ${limit} buscas deste mês. O limite renova no dia 1º.`, 429)
    }

    const upstream = await fetch(SEARCH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': placesKey,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: `${niche} em ${city}`,
        languageCode: 'pt-BR',
        regionCode: 'BR',
        pageSize: 20,
        ...(body.pageToken ? { pageToken: body.pageToken } : {}),
      }),
    })

    if (!upstream.ok) {
      console.error('buyers-hunter upstream', upstream.status, await upstream.text())
      return fail('upstream_error', 'Não foi possível buscar empresas agora. Tente de novo em instantes.', 502)
    }

    const payload = (await upstream.json()) as { places?: RawPlace[]; nextPageToken?: string }
    const results = (payload.places ?? [])
      .filter((place) => place.businessStatus !== 'CLOSED_PERMANENTLY')
      .map(normalize)

    const { error: insertError } = await admin.from('prospect_searches').insert({
      user_id: userId,
      niche,
      city,
      offer: body.offer ?? null,
      results_count: results.length,
    })
    if (insertError) console.error('buyers-hunter insert', insertError.message)

    return json({
      results,
      nextPageToken: payload.nextPageToken ?? null,
      usage: { configured: true, used: used + 1, limit },
    })
  } catch (error) {
    console.error('buyers-hunter', error)
    return fail('internal', 'Erro inesperado na busca. Tente de novo.', 500)
  }
})
