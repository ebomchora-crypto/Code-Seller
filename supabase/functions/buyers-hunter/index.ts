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
//   { action: 'usage' }                                                         → { configured, used, limit }
//   { action: 'search', niche, city, state?, country?, offer?, maxResults?, website? } → { results, usage }
//
// country: código ISO de 2 letras (padrão BR). A busca acontece nesse país, no
// idioma dele, e os telefones voltam com o código do país (+351, +55...).
// maxResults: quantos leads trazer (1 a MAX_RESULTS_PER_SEARCH, padrão 20).
// Cada busca conta 1 no limite, não importa a quantidade pedida. Teste grátis:
// limite por dia (usage_for no banco); demais planos: limite mensal.
// Persist normalized provider observations to enrich leads imported into the CRM.

import { createClient } from 'jsr:@supabase/supabase-js@2'
import {
  filterSearchResults,
  normalizePlace,
  mergeProviderResults,
  searchRuns,
  type ApifyPlace,
  type NormalizedProspect,
  type ProviderRun,
  type WebsiteSearch,
} from './prospect.ts'
import { findCountry, internationalPhone, type Country } from '../_shared/countries.ts'
import { hunterDailyLimitMessage, NO_ACCESS_MESSAGE, planUsage, TRIAL_RESULTS_PER_SEARCH } from '../_shared/plan.ts'

const APIFY_RUN_URL = 'https://api.apify.com/v2/acts/compass~crawler-google-places/run-sync-get-dataset-items?memory=1024'
const DEFAULT_RESULTS = 20
const MAX_RESULTS_PER_SEARCH = 30 // trava o custo (e o crédito da Apify) de uma única busca

const DEFAULT_MONTHLY_LIMIT = 50

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

function isWebsiteSearch(value: unknown): value is WebsiteSearch {
  return value === 'all' || value === 'yes' || value === 'no'
}

async function fetchProviderRun(
  run: ProviderRun,
  input: { token: string; niche: string; location: string; country: Country; createdAt: string },
): Promise<NormalizedProspect[]> {
  const upstream = await fetch(APIFY_RUN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${input.token}`,
    },
    body: JSON.stringify({
      searchStringsArray: [input.niche],
      locationQuery: input.location,
      language: input.country.language,
      maxCrawledPlacesPerSearch: run.maxResults,
      skipClosedPlaces: true,
      website: run.website,
    }),
  })

  if (!upstream.ok) {
    console.error('buyers-hunter upstream', upstream.status, await upstream.text())
    throw new Error(`upstream:${upstream.status}`)
  }

  const payload = (await upstream.json()) as ApifyPlace[]
  return payload
    .filter((place) => place.placeId && !place.permanentlyClosed && !place.temporarilyClosed)
    .map((place) => {
      const prospect = normalizePlace(place, run.provenance, input.createdAt)
      const country = prospect.country?.toUpperCase() || input.country.code
      return {
        ...prospect,
        country,
        // Telefone pronto para o WhatsApp, com o código do país da busca.
        phone_international: internationalPhone(prospect.phone, prospect.phone_international, country),
      }
    })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return fail('invalid_input', 'Método inválido.', 405)

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
      state?: string
      country?: string
      offer?: string
      maxResults?: number
      website?: string
    }

    const plan = await planUsage(userId, userData.user.email)
    const daily = plan.hunter_daily_limit !== null
    // No teste grátis cada busca traz menos empresas (custo de quem ainda não paga).
    const maxResults = plan.plan === 'trial' ? TRIAL_RESULTS_PER_SEARCH : MAX_RESULTS_PER_SEARCH

    if (body.action === 'usage') {
      return json(daily
        ? { configured: Boolean(apifyToken), used: plan.hunter_used_today, limit: plan.hunter_daily_limit, period: 'day', max_results: maxResults }
        : { configured: Boolean(apifyToken), used, limit, period: 'month', max_results: maxResults })
    }

    if (body.action !== 'search') return fail('invalid_input', 'Ação inválida.', 400)
    // Sem teste grátis válido nem assinatura em dia, não busca.
    if (!plan.access) return fail('no_access', NO_ACCESS_MESSAGE, 402)
    if (!apifyToken) return fail('not_configured', 'A busca ainda não está disponível.', 503)

    const niche = body.niche?.trim().slice(0, 80) ?? ''
    const city = body.city?.trim().slice(0, 80) ?? ''
    const state = body.state?.trim().slice(0, 80) ?? ''
    const country = findCountry(body.country)
    if (niche.length < 2 || city.length < 2) {
      return fail('invalid_input', 'Informe o nicho e a cidade.', 400)
    }
    if (daily && plan.hunter_used_today >= plan.hunter_daily_limit!) {
      return fail('limit_reached', hunterDailyLimitMessage(plan), 429)
    }
    if (!daily && used >= limit) {
      return fail('limit_reached', `Você usou as ${limit} buscas deste mês. O limite renova no dia 1º.`, 429)
    }

    const wanted = Math.min(Math.max(Math.round(Number(body.maxResults)) || DEFAULT_RESULTS, 1), maxResults)
    const website: WebsiteSearch = isWebsiteSearch(body.website) ? body.website : 'all'
    const location = [city, state, country.searchName].filter(Boolean).join(', ')
    const createdAt = new Date().toISOString()
    let results: NormalizedProspect[]
    try {
      const batches = await Promise.all(
        searchRuns({ website, maxResults: wanted }).map((run) =>
          fetchProviderRun(run, { token: apifyToken, niche, location, country, createdAt }),
        ),
      )
      results = filterSearchResults(mergeProviderResults(batches.flat()), website).slice(0, wanted)
    } catch (reason) {
      console.error('buyers-hunter provider runs', reason)
      return fail('upstream_error', 'Não foi possível buscar empresas agora. Tente de novo em instantes.', 502)
    }

    const { error: insertError } = await admin.from('prospect_searches').insert({
      user_id: userId,
      niche,
      city,
      state: state || null,
      country: country.code,
      offer: body.offer ?? null,
      website_filter: website,
      results_count: results.length,
      results,
    })
    if (insertError) throw new Error(insertError.message)

    return json({
      results,
      usage: daily
        ? { configured: true, used: plan.hunter_used_today + 1, limit: plan.hunter_daily_limit, period: 'day' }
        : { configured: true, used: used + 1, limit, period: 'month' },
    })
  } catch (error) {
    console.error('buyers-hunter', error)
    return fail('internal', 'Erro inesperado na busca. Tente de novo.', 500)
  }
})
