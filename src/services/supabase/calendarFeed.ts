import { supabase } from '@/lib/supabaseClient'

// Link secreto da agenda das tarefas (ver migração 0023 e função calendar-feed).

export async function getCalendarFeedToken(): Promise<string> {
  const { data, error } = await supabase.rpc('get_calendar_feed_token')
  if (error || typeof data !== 'string') throw new Error(error?.message ?? 'Não foi possível carregar o link da agenda.')
  return data
}

// Troca o link: o antigo para de funcionar na hora.
export async function regenerateCalendarFeedToken(): Promise<string> {
  const { data, error } = await supabase.rpc('regenerate_calendar_feed_token')
  if (error || typeof data !== 'string') throw new Error(error?.message ?? 'Não foi possível gerar um novo link.')
  return data
}

export function calendarFeedUrls(token: string, origin = window.location.origin) {
  const https = `${origin}/agenda/${token}.ics`
  const webcal = https.replace(/^https?:/, 'webcal:')
  return {
    https,
    webcal,
    // Abre o Google Agenda já perguntando se quer adicionar a agenda.
    google: `https://calendar.google.com/calendar/r?cid=${webcal}`,
  }
}
