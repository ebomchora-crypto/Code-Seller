// Supabase Edge Function — notificações no celular (Web Push).
//
// Ações (POST com JSON):
//   { action: 'config' }    → { publicKey } — chave pública para o navegador se inscrever
//   { action: 'test' }      → envia um aviso de teste para os aparelhos do usuário logado
//   { action: 'dispatch' }  → chamada pelo cron (header x-cron-secret): lembretes de
//                             tarefa, resumo diário e resumo semanal
//
// Deploy (a função é chamada pelo cron, sem login — por isso sem verificação de JWT;
// a ação 'dispatch' é protegida pelo segredo do cron e 'test' exige usuário logado):
//   supabase functions deploy notifications-dispatch --no-verify-jwt
//
// Configuração: lida primeiro dos secrets da função (VAPID_PUBLIC_KEY,
// VAPID_PRIVATE_KEY, VAPID_SUBJECT, CRON_SECRET) e, na falta deles, da tabela
// public.app_config (RLS ligado, sem acesso para anon/authenticated). Sem
// chaves VAPID em nenhum dos dois, a função gera um par na primeira chamada e
// guarda em app_config — assim nenhum segredo precisa passar por fora.

import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DAY_MS = 24 * 60 * 60 * 1000
const STALL_DAYS = 10
const DEFAULT_TIMEZONE = 'America/Sao_Paulo'

interface PushPayload {
  title: string
  body: string
  url: string
  tag?: string
}

interface SubscriptionRow {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`
}

// Data (YYYY-MM-DD), hora e dia da semana no fuso do usuário.
function localParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
    weekday: 'short',
  }).formatToParts(date)
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? ''
  return { date: `${get('year')}-${get('month')}-${get('day')}`, hour: Number(get('hour')), weekday: get('weekday') }
}

async function sendToSubscriptions(admin: SupabaseClient, subscriptions: SubscriptionRow[], payload: PushPayload) {
  let delivered = 0
  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
        JSON.stringify(payload),
        { TTL: 60 * 60 * 6 },
      )
      delivered++
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode
      // Aparelho desinscrito ou expirado: remove para não tentar de novo.
      if (status === 404 || status === 410) {
        await admin.from('push_subscriptions').delete().eq('id', subscription.id)
      } else {
        console.error('push error', status, error)
      }
    }
  }
  return delivered
}

async function subscriptionsByUser(admin: SupabaseClient) {
  const { data, error } = await admin.from('push_subscriptions').select('id, user_id, endpoint, p256dh, auth')
  if (error) throw new Error(error.message)
  const map = new Map<string, SubscriptionRow[]>()
  for (const row of (data ?? []) as SubscriptionRow[]) {
    map.set(row.user_id, [...(map.get(row.user_id) ?? []), row])
  }
  return map
}

async function sendTaskReminders(admin: SupabaseClient, subs: Map<string, SubscriptionRow[]>, now: Date) {
  const { data, error } = await admin
    .from('tasks')
    .select('id, user_id, title, due_date')
    .is('reminder_sent_at', null)
    .not('reminder_at', 'is', null)
    .lte('reminder_at', now.toISOString())
    .gte('reminder_at', new Date(now.getTime() - DAY_MS).toISOString())
    .in('status', ['todo', 'in_progress'])
  if (error) throw new Error(error.message)

  const { data: prefs } = await admin.from('notification_preferences').select('user_id, task_reminders')
  const disabled = new Set((prefs ?? []).filter((row) => row.task_reminders === false).map((row) => row.user_id))

  let sent = 0
  for (const task of data ?? []) {
    const userSubs = subs.get(task.user_id)
    if (userSubs && !disabled.has(task.user_id)) {
      const due = task.due_date
        ? new Date(task.due_date).toLocaleString('pt-BR', {
            timeZone: DEFAULT_TIMEZONE,
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })
        : null
      await sendToSubscriptions(admin, userSubs, {
        title: `Lembrete: ${task.title}`,
        body: due ? `Prazo: ${due}` : 'Toque para abrir suas tarefas.',
        url: '/tasks',
        tag: `task-${task.id}`,
      })
      sent++
    }
    await admin.from('tasks').update({ reminder_sent_at: now.toISOString() }).eq('id', task.id)
  }
  return sent
}

async function buildDailySummary(admin: SupabaseClient, userId: string, now: Date, prefs: Record<string, unknown>) {
  const endOfToday = new Date(now.getTime() + DAY_MS).toISOString()
  const lines: string[] = []

  const { data: tasks } = await admin
    .from('tasks')
    .select('id, due_date')
    .eq('user_id', userId)
    .is('parent_task_id', null)
    .in('status', ['todo', 'in_progress'])
    .lt('due_date', endOfToday)
  const taskCount = tasks?.length ?? 0
  const overdue = (tasks ?? []).filter((task) => new Date(task.due_date).getTime() < now.getTime() - 12 * 60 * 60 * 1000).length
  if (taskCount > 0 && prefs.overdue_tasks !== false) {
    lines.push(`${plural(taskCount, 'tarefa', 'tarefas')} para hoje${overdue > 0 ? ` (${overdue} atrasada${overdue > 1 ? 's' : ''})` : ''}`)
  }

  if (prefs.stalled_deals !== false) {
    const { data: deals } = await admin.from('deals').select('id, updated_at').eq('user_id', userId).eq('status', 'open')
    const ids = (deals ?? []).map((deal) => deal.id)
    if (ids.length > 0) {
      const { data: activities } = await admin
        .from('deal_activities')
        .select('deal_id, occurred_at')
        .in('deal_id', ids)
        .order('occurred_at', { ascending: false })
      const last = new Map<string, string>()
      for (const row of activities ?? []) if (!last.has(row.deal_id)) last.set(row.deal_id, row.occurred_at)
      const stalled = (deals ?? []).filter(
        (deal) => now.getTime() - new Date(last.get(deal.id) ?? deal.updated_at).getTime() >= STALL_DAYS * DAY_MS,
      ).length
      if (stalled > 0) lines.push(`${plural(stalled, 'negócio parado', 'negócios parados')}`)
    }
  }

  if (prefs.financial_alerts !== false) {
    const limit = new Date(now.getTime() + 7 * DAY_MS).toISOString().slice(0, 10)
    const { data: receivables } = await admin
      .from('receivables')
      .select('amount')
      .eq('user_id', userId)
      .in('status', ['pending', 'overdue'])
      .lte('due_date', limit)
    const total = (receivables ?? []).reduce((sum, row) => sum + Number(row.amount), 0)
    if (total > 0) lines.push(`${formatBRL(total)} a receber nos próximos 7 dias`)
  }

  return lines
}

async function buildWeeklySummary(admin: SupabaseClient, userId: string, now: Date) {
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS).toISOString()
  // Usa a data real do ganho (migração 0012); sem ela, a última atualização.
  let { data: won, error: wonError } = await admin
    .from('deals')
    .select('value')
    .eq('user_id', userId)
    .eq('status', 'won')
    .gte('won_at', weekAgo)
  if (wonError) {
    ;({ data: won } = await admin
      .from('deals')
      .select('value')
      .eq('user_id', userId)
      .eq('status', 'won')
      .gte('updated_at', weekAgo))
  }
  const { count: newContacts } = await admin
    .from('contacts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', weekAgo)
  const { count: doneTasks } = await admin
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'done')
    .gte('completed_at', weekAgo)

  const wonTotal = (won ?? []).reduce((sum, row) => sum + Number(row.value ?? 0), 0)
  return `Semana passada: ${formatBRL(wonTotal)} em ${plural(won?.length ?? 0, 'venda', 'vendas')}, ${plural(
    newContacts ?? 0,
    'contato novo',
    'contatos novos',
  )} e ${plural(doneTasks ?? 0, 'tarefa concluída', 'tarefas concluídas')}.`
}

async function sendSummaries(admin: SupabaseClient, subs: Map<string, SubscriptionRow[]>, now: Date) {
  const userIds = [...subs.keys()]
  if (userIds.length === 0) return 0

  const [{ data: prefsRows }, { data: profiles }] = await Promise.all([
    admin.from('notification_preferences').select('*').in('user_id', userIds),
    admin.from('user_profiles').select('id, timezone').in('id', userIds),
  ])
  const prefsByUser = new Map((prefsRows ?? []).map((row) => [row.user_id as string, row as Record<string, unknown>]))
  const tzByUser = new Map((profiles ?? []).map((row) => [row.id as string, (row.timezone as string) || DEFAULT_TIMEZONE]))

  let sent = 0
  for (const userId of userIds) {
    const prefs = prefsByUser.get(userId) ?? {}
    const timeZone = tzByUser.get(userId) ?? DEFAULT_TIMEZONE
    let local
    try {
      local = localParts(now, timeZone)
    } catch {
      local = localParts(now, DEFAULT_TIMEZONE)
    }
    const hour = typeof prefs.daily_summary_hour === 'number' ? prefs.daily_summary_hour : 8
    if (local.hour < hour) continue

    const updates: Record<string, string> = {}

    if (prefs.daily_summary !== false && prefs.last_daily_summary_on !== local.date) {
      updates.last_daily_summary_on = local.date
      const lines = await buildDailySummary(admin, userId, now, prefs)
      if (lines.length > 0) {
        await sendToSubscriptions(admin, subs.get(userId) ?? [], {
          title: 'Seu foco de hoje',
          body: lines.join(' · '),
          url: '/',
          tag: 'daily-summary',
        })
        sent++
      }
    }

    if (prefs.weekly_summary === true && local.weekday === 'Mon' && prefs.last_weekly_summary_on !== local.date) {
      updates.last_weekly_summary_on = local.date
      await sendToSubscriptions(admin, subs.get(userId) ?? [], {
        title: 'Resumo da semana',
        body: await buildWeeklySummary(admin, userId, now),
        url: '/',
        tag: 'weekly-summary',
      })
      sent++
    }

    if (Object.keys(updates).length > 0) {
      if (prefsByUser.has(userId)) {
        await admin.from('notification_preferences').update(updates).eq('user_id', userId)
      } else {
        await admin.from('notification_preferences').insert({ user_id: userId, ...updates })
      }
    }
  }
  return sent
}

async function readConfig(admin: SupabaseClient): Promise<Map<string, string>> {
  const { data } = await admin.from('app_config').select('key, value')
  return new Map((data ?? []).map((row) => [row.key as string, row.value as string]))
}

// Chaves VAPID: secrets da função ou app_config; se não houver, gera e guarda.
async function getVapidKeys(admin: SupabaseClient, config: Map<string, string>) {
  const envPublic = Deno.env.get('VAPID_PUBLIC_KEY')
  const envPrivate = Deno.env.get('VAPID_PRIVATE_KEY')
  if (envPublic && envPrivate) return { publicKey: envPublic, privateKey: envPrivate }

  const storedPublic = config.get('vapid_public_key')
  const storedPrivate = config.get('vapid_private_key')
  if (storedPublic && storedPrivate) return { publicKey: storedPublic, privateKey: storedPrivate }

  const generated = webpush.generateVAPIDKeys()
  // ignoreDuplicates: se duas chamadas gerarem ao mesmo tempo, vale a primeira.
  await admin.from('app_config').upsert(
    [
      { key: 'vapid_public_key', value: generated.publicKey },
      { key: 'vapid_private_key', value: generated.privateKey },
    ],
    { onConflict: 'key', ignoreDuplicates: true },
  )
  const fresh = await readConfig(admin)
  return {
    publicKey: fresh.get('vapid_public_key') ?? generated.publicKey,
    privateKey: fresh.get('vapid_private_key') ?? generated.privateKey,
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = (await req.json().catch(() => ({}))) as { action?: string }
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const config = await readConfig(admin)
    const { publicKey, privateKey } = await getVapidKeys(admin, config)
    const subject = Deno.env.get('VAPID_SUBJECT') ?? config.get('vapid_subject') ?? 'mailto:contato@codesellers.com.br'

    if (body.action === 'config') {
      return json({ publicKey })
    }
    webpush.setVapidDetails(subject, publicKey, privateKey)

    if (body.action === 'test') {
      const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
      })
      const { data: userData } = await userClient.auth.getUser()
      if (!userData.user) return json({ error: 'Sessão expirada. Entre novamente.' }, 401)

      const { data: rows } = await admin
        .from('push_subscriptions')
        .select('id, user_id, endpoint, p256dh, auth')
        .eq('user_id', userData.user.id)
      const delivered = await sendToSubscriptions(admin, (rows ?? []) as SubscriptionRow[], {
        title: 'Notificações ativadas',
        body: 'É assim que os lembretes e o resumo do dia vão chegar.',
        url: '/settings',
        tag: 'test',
      })
      return json({ delivered })
    }

    if (body.action === 'dispatch') {
      const cronSecret = Deno.env.get('CRON_SECRET') ?? config.get('cron_secret')
      if (!cronSecret || req.headers.get('x-cron-secret') !== cronSecret) {
        return json({ error: 'Não autorizado.' }, 401)
      }
      const now = new Date()
      const subs = await subscriptionsByUser(admin)
      const reminders = await sendTaskReminders(admin, subs, now)
      const summaries = await sendSummaries(admin, subs, now)
      return json({ reminders, summaries })
    }

    return json({ error: 'Ação inválida.' }, 400)
  } catch (error) {
    console.error('notifications-dispatch', error)
    return json({ error: 'Erro inesperado.' }, 500)
  }
})
