// Supabase Edge Function — agenda das tarefas (.ics) para Google Agenda,
// Outlook e Calendário do iPhone/Mac.
//
// GET ?token=<64 hex>[.ics] → agenda com as tarefas abertas com prazo (dos
// últimos 30 dias em diante). Sem login: quem busca a agenda é o próprio
// Google/Outlook; o acesso é pelo token secreto (tabela calendar_feeds).
// O site expõe isto em /agenda/<token>.ics (rewrite no vercel.json).
//
// Deploy: supabase functions deploy calendar-feed --no-verify-jwt

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { buildTaskCalendar, type CalendarTask } from './ics.ts'

const TOKEN_PATTERN = /^[a-f0-9]{64}$/
const SITE_URL = 'https://codesellers.vercel.app'
const DEFAULT_TIMEZONE = 'America/Sao_Paulo'
const PAST_DAYS = 30
const MAX_EVENTS = 500

function notFound() {
  return new Response('Agenda não encontrada.', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return new Response('Método não permitido.', { status: 405 })
  }

  const token = (new URL(req.url).searchParams.get('token') ?? '').replace(/\.ics$/i, '').toLowerCase()
  if (!TOKEN_PATTERN.test(token)) return notFound()

  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
      auth: { persistSession: false },
    })

    const { data: feed, error: feedError } = await admin
      .from('calendar_feeds')
      .select('user_id')
      .eq('token', token)
      .maybeSingle()
    if (feedError) throw new Error(feedError.message)
    if (!feed) return notFound()

    const since = new Date(Date.now() - PAST_DAYS * 24 * 60 * 60 * 1000).toISOString()
    const [{ data: tasks, error: tasksError }, { data: profile }] = await Promise.all([
      admin
        .from('tasks')
        .select('id, title, description, due_date, reminder_at, updated_at, contact:contacts(name), deal:deals(title)')
        .eq('user_id', feed.user_id)
        .in('status', ['todo', 'in_progress'])
        .not('due_date', 'is', null)
        .gte('due_date', since)
        .order('due_date', { ascending: true })
        .limit(MAX_EVENTS),
      admin.from('user_profiles').select('timezone').eq('id', feed.user_id).maybeSingle(),
    ])
    if (tasksError) throw new Error(tasksError.message)

    const body = buildTaskCalendar((tasks ?? []) as unknown as CalendarTask[], {
      now: new Date(),
      siteUrl: SITE_URL,
      timeZone: (profile?.timezone as string | undefined) || DEFAULT_TIMEZONE,
      calendarName: 'Code Sellers — Tarefas',
    })

    return new Response(req.method === 'HEAD' ? null : body, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'inline; filename="code-sellers-tarefas.ics"',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('calendar-feed', error)
    return new Response('Erro ao montar a agenda.', { status: 500 })
  }
})
