// Supabase Edge Function — Code Maker (sites gerados por IA).
//
// Usuário logado (Authorization: Bearer <token>). Ações:
//   { action: 'usage' }                         → quantos sites/alterações hoje
//   { action: 'create', brief, contact_id? }    → cria o site (sem IA ainda)
//   { action: 'plan', site_id, partial? }       → IA planeja cores/fontes/seções (texto ao vivo)
//   { action: 'part', site_id, part_id, partial? } → IA escreve uma parte (texto ao vivo)
//   { action: 'edit', site_id, instruction, partial? } → IA altera o site (texto ao vivo)
//
// As respostas "ao vivo" são texto puro, terminando com uma linha:
//   <<<OK>>>  |  <<<CONTINUA>>> (tempo da chamada acabou: chame de novo com
//   partial = tudo o que chegou até agora)  |  <<<ERRO:mensagem>>>
//
// A chave e o modelo da IA ficam em app_config (code_maker_api_key,
// code_maker_model). Deploy: supabase functions deploy code-maker --no-verify-jwt

import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'
import {
  applyEdit,
  assembleSite,
  buildEditMessage,
  buildPartMessage,
  buildPlanMessage,
  CONTINUE_PROMPT,
  EDIT_SYSTEM,
  fillBrief,
  joinContinuation,
  parseEdit,
  parsePart,
  parsePlan,
  partOrder,
  PART_SYSTEM,
  PLAN_SYSTEM,
  type SiteBrief,
  type SiteParts,
  type SitePlan,
} from './site.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const AI_URL = 'https://api.experientiallabs.ai/v1/chat/completions'
const SITES_PER_DAY = 10
const EDITS_PER_DAY = 60
const CALLS_PER_DAY = 600
// O servidor corta cada chamada em 150 s; paramos antes e continuamos depois.
const CALL_BUDGET_MS = 115_000
const MAX_TOKENS = { plan: 3000, part: 6000, edit: 9000 } as const

type Message = { role: 'system' | 'user' | 'assistant'; content: string }
type SiteRow = {
  id: string
  user_id: string
  slug: string
  name: string
  brief: SiteBrief
  plan: (SitePlan & { actions?: string[] }) | null
  parts: SiteParts
  status: string
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

// Início do dia no horário de Brasília (sem horário de verão desde 2019).
function startOfDaySaoPaulo(now = new Date()): string {
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(now)
  return new Date(`${day}T00:00:00-03:00`).toISOString()
}

async function countToday(admin: SupabaseClient, userId: string, kind?: string): Promise<number> {
  let query = admin
    .from('code_maker_calls')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfDaySaoPaulo())
  if (kind) query = query.eq('kind', kind)
  const { count } = await query
  return count ?? 0
}

function slugify(value: string): string {
  const base = value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '')
  return base.length >= 3 ? base : `site-${base || 'novo'}`.slice(0, 40)
}

async function uniqueSlug(admin: SupabaseClient, name: string): Promise<string> {
  const base = slugify(name)
  for (let attempt = 0; attempt < 30; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`
    const { data } = await admin.from('sites').select('id').eq('slug', candidate).maybeSingle()
    if (!data) return candidate
  }
  return `${base}-${crypto.randomUUID().slice(0, 6)}`
}

function cleanBrief(input: Record<string, unknown>): SiteBrief | null {
  const text = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '')
  const businessName = text(input.businessName, 120)
  const details = text(input.details, 4000)
  if (!businessName && !details) return null
  const style = ['auto', 'dark', 'minimal', 'elegant', 'vibrant'].includes(String(input.style)) ? (input.style as SiteBrief['style']) : 'auto'
  const rating = Number(input.rating)
  const reviews = Number(input.reviews)
  return {
    businessName,
    niche: text(input.niche, 80) || null,
    city: text(input.city, 80) || null,
    phone: text(input.phone, 30) || null,
    style,
    details: details || null,
    rating: Number.isFinite(rating) && rating > 0 && rating <= 5 ? rating : null,
    reviews: Number.isFinite(reviews) && reviews > 0 ? Math.round(reviews) : null,
  }
}

// Chama a IA com streaming e repassa o texto ao cliente. Se o tempo da
// chamada acabar, avisa <<<CONTINUA>>>; se terminar, chama `finish` com o
// texto completo (juntando com o que veio antes) e manda <<<OK>>> ou erro.
function streamAi(options: {
  apiKey: string
  model: string
  messages: Message[]
  maxTokens: number
  partial: string
  finish: (fullText: string) => Promise<string | null>
}): Response {
  const encoder = new TextEncoder()
  const messages: Message[] = options.partial
    ? [...options.messages, { role: 'assistant', content: options.partial }, { role: 'user', content: CONTINUE_PROMPT }]
    : options.messages

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (text: string) => controller.enqueue(encoder.encode(text))
      const abort = new AbortController()
      const deadline = Date.now() + CALL_BUDGET_MS
      const timer = setTimeout(() => abort.abort(), CALL_BUDGET_MS)
      let text = ''
      let timedOut = false
      try {
        const response = await fetch(AI_URL, {
          method: 'POST',
          headers: { Authorization: `Bearer ${options.apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: options.model, max_tokens: options.maxTokens, stream: true, messages }),
          signal: abort.signal,
        })
        if (!response.ok || !response.body) {
          console.error('code-maker ai', response.status, await response.text().catch(() => ''))
          send('\n<<<ERRO:A IA não respondeu agora. Tente de novo em instantes.>>>')
          controller.close()
          return
        }
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          let index
          while ((index = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, index).trim()
            buffer = buffer.slice(index + 1)
            if (!line.startsWith('data:')) continue
            const data = line.slice(5).trim()
            if (!data || data === '[DONE]') continue
            try {
              const delta = JSON.parse(data).choices?.[0]?.delta?.content
              if (delta) {
                text += delta
                send(delta)
              }
            } catch {
              // pedaço incompleto: ignora
            }
          }
          if (Date.now() > deadline) {
            timedOut = true
            abort.abort()
            break
          }
        }
      } catch (error) {
        if ((error as Error)?.name === 'AbortError') timedOut = true
        else {
          console.error('code-maker stream', error)
          send('\n<<<ERRO:A conexão com a IA caiu. Tente de novo.>>>')
          controller.close()
          clearTimeout(timer)
          return
        }
      }
      clearTimeout(timer)

      if (timedOut) {
        send('\n<<<CONTINUA>>>')
        controller.close()
        return
      }
      try {
        const full = options.partial ? joinContinuation(options.partial, text) : text
        const problem = await options.finish(full)
        send(problem ? `\n<<<ERRO:${problem}>>>` : '\n<<<OK>>>')
      } catch (error) {
        console.error('code-maker finish', error)
        send('\n<<<ERRO:Não foi possível salvar. Tente de novo.>>>')
      }
      controller.close()
    },
  })

  return new Response(stream, {
    headers: { ...corsHeaders, 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Método não permitido.' }, 405)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    })
    const { data: userData } = await userClient.auth.getUser()
    const user = userData.user
    if (!user) return json({ error: 'Sessão expirada. Entre novamente.' }, 401)

    const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const action = String(body.action ?? '')

    if (action === 'usage') {
      const [sites, edits] = await Promise.all([countToday(admin, user.id, 'create'), countToday(admin, user.id, 'edit')])
      return json({ sites_today: sites, sites_limit: SITES_PER_DAY, edits_today: edits, edits_limit: EDITS_PER_DAY })
    }

    if (action === 'create') {
      const brief = cleanBrief((body.brief ?? {}) as Record<string, unknown>)
      if (!brief) return json({ error: 'Escreva o que você quer no site.' }, 400)
      if ((await countToday(admin, user.id, 'create')) >= SITES_PER_DAY) {
        return json({ error: `Você já criou ${SITES_PER_DAY} sites hoje. Amanhã libera de novo — e dá para alterar os que já existem.` }, 429)
      }
      let contactId: string | null = null
      if (typeof body.contact_id === 'string') {
        const { data } = await admin.from('contacts').select('id').eq('id', body.contact_id).eq('user_id', user.id).maybeSingle()
        contactId = data?.id ?? null
      }
      const { data: site, error } = await admin
        .from('sites')
        .insert({
          user_id: user.id,
          // Sem nome ainda (pedido livre): link provisório até a IA ler o pedido.
          slug: brief.businessName ? await uniqueSlug(admin, brief.businessName) : `site-${crypto.randomUUID().slice(0, 8)}`,
          name: brief.businessName || 'Novo site',
          brief,
          contact_id: contactId,
        })
        .select('id, slug, name, status')
        .single()
      if (error) throw error
      await admin.from('code_maker_calls').insert({ user_id: user.id, kind: 'create' })
      return json({ site })
    }

    if (!['plan', 'part', 'edit'].includes(action)) return json({ error: 'Ação inválida.' }, 400)

    const { data: siteData } = await admin
      .from('sites')
      .select('id, user_id, slug, name, brief, plan, parts, status')
      .eq('id', String(body.site_id ?? ''))
      .eq('user_id', user.id)
      .maybeSingle()
    const site = siteData as SiteRow | null
    if (!site) return json({ error: 'Site não encontrado.' }, 404)

    const partial = typeof body.partial === 'string' ? body.partial.slice(0, 120_000) : ''
    if ((await countToday(admin, user.id)) >= CALLS_PER_DAY) {
      return json({ error: 'Limite de uso da IA de hoje atingido. Amanhã libera de novo.' }, 429)
    }

    const { data: config } = await admin.from('app_config').select('key, value').in('key', ['code_maker_api_key', 'code_maker_model'])
    const settings = new Map((config ?? []).map((row: { key: string; value: string }) => [row.key, row.value]))
    const apiKey = Deno.env.get('CODE_MAKER_API_KEY') ?? settings.get('code_maker_api_key')
    const model = settings.get('code_maker_model') ?? 'deepseek-v4-flash'
    if (!apiKey) return json({ error: 'O Code Maker ainda não foi configurado.' }, 503)

    if (action === 'plan') {
      if (!partial) await admin.from('code_maker_calls').insert({ user_id: user.id, kind: 'plan' })
      return streamAi({
        apiKey,
        model,
        maxTokens: MAX_TOKENS.plan,
        partial,
        messages: [
          { role: 'system', content: PLAN_SYSTEM },
          { role: 'user', content: buildPlanMessage(site.brief) },
        ],
        finish: async (full) => {
          const { actions, plan, business } = parsePlan(full, site.brief)
          if (!plan) {
            await admin.from('sites').update({ status: 'error' }).eq('id', site.id)
            return 'A IA não conseguiu planejar o site. Tente gerar de novo.'
          }
          const brief = fillBrief(site.brief, business)
          const renamed = !site.brief.businessName && brief.businessName
          await admin
            .from('sites')
            .update({
              plan: { ...plan, actions },
              parts: {},
              status: 'building',
              html: null,
              brief,
              ...(renamed ? { name: brief.businessName, slug: await uniqueSlug(admin, brief.businessName) } : {}),
            })
            .eq('id', site.id)
          return null
        },
      })
    }

    if (!site.plan) return json({ error: 'O site ainda não foi planejado.' }, 409)
    const plan = site.plan
    // As ações do plano ficam guardadas junto, mas não precisam ir para a IA.
    const { actions: _planActions, ...planForAi } = plan

    if (action === 'part') {
      const partId = String(body.part_id ?? '')
      if (!partOrder(plan).includes(partId)) return json({ error: 'Parte inválida.' }, 400)
      if (!partial) await admin.from('code_maker_calls').insert({ user_id: user.id, kind: 'part' })
      return streamAi({
        apiKey,
        model,
        maxTokens: MAX_TOKENS.part,
        partial,
        messages: [
          { role: 'system', content: PART_SYSTEM },
          { role: 'user', content: buildPartMessage(partId, planForAi, site.brief) },
        ],
        finish: async (full) => {
          const { html } = parsePart(full)
          if (!html) return 'A IA devolveu esta parte vazia. Tente de novo.'
          const { data: merged, error } = await admin.rpc('code_maker_merge_part', { p_site: site.id, p_part: partId, p_html: html })
          if (error) throw error
          const parts = (merged ?? {}) as SiteParts
          if (partOrder(plan).every((id) => parts[id])) {
            const { data: first } = await admin.rpc('code_maker_mark_ready', { p_site: site.id, p_html: assembleSite(plan, parts) })
            if (first === true) {
              await admin.from('site_versions').insert({
                site_id: site.id,
                user_id: user.id,
                kind: 'create',
                actions: plan.actions ?? [],
                plan,
                parts,
              })
            }
          }
          return null
        },
      })
    }

    // action === 'edit'
    const instruction = String(body.instruction ?? '').trim().slice(0, 2000)
    if (!instruction) return json({ error: 'Diga o que você quer mudar.' }, 400)
    if (site.status !== 'ready') return json({ error: 'Espere o site terminar de ser gerado.' }, 409)
    if (!partial) {
      if ((await countToday(admin, user.id, 'edit')) >= EDITS_PER_DAY) {
        return json({ error: `Você já fez ${EDITS_PER_DAY} alterações hoje. Amanhã libera de novo.` }, 429)
      }
      await admin.from('code_maker_calls').insert({ user_id: user.id, kind: 'edit' })
    }
    return streamAi({
      apiKey,
      model,
      maxTokens: MAX_TOKENS.edit,
      partial,
      messages: [
        { role: 'system', content: EDIT_SYSTEM },
        { role: 'user', content: buildEditMessage(planForAi, site.parts, instruction, site.brief) },
      ],
      finish: async (full) => {
        const edit = parseEdit(full)
        if (edit.parts.length === 0 && edit.removals.length === 0 && !edit.theme) {
          return 'Não entendi o que mudar. Tente explicar de outro jeito.'
        }
        const next = applyEdit(plan, site.parts, edit)
        const nextPlan = { ...next.plan, actions: plan.actions ?? [] }
        const { error } = await admin
          .from('sites')
          .update({ plan: nextPlan, parts: next.parts, html: assembleSite(next.plan, next.parts) })
          .eq('id', site.id)
        if (error) throw error
        await admin.from('site_versions').insert({
          site_id: site.id,
          user_id: user.id,
          kind: 'edit',
          instruction,
          actions: edit.actions,
          plan: nextPlan,
          parts: next.parts,
        })
        return null
      },
    })
  } catch (error) {
    console.error('code-maker', error)
    return json({ error: 'Erro inesperado. Tente de novo.' }, 500)
  }
})
