import { supabase } from '@/lib/supabaseClient'

// Dados dos cards "Previsão do mês" e "Buyers Hunter" do Início.

export interface MonthForecast {
  count: number
  weighted: number // soma de valor × probabilidade
  best: number // se todos fecharem
}

export interface HunterResult {
  imported: number
  importedThisMonth: number
  withDeal: number
  won: number
  wonValue: number
  searchesThisMonth: number | null
}

function monthBounds(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const day = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  return { start, end, startDay: day(start), endDay: day(end) }
}

// Negócios abertos com fechamento previsto para este mês.
export async function getMonthForecast(): Promise<MonthForecast> {
  const { startDay, endDay } = monthBounds()
  const { data, error } = await supabase
    .from('deals')
    .select('value, probability, expected_close_date, status')
    .eq('status', 'open')
    .gte('expected_close_date', startDay)
    .lt('expected_close_date', endDay)

  if (error) throw new Error(error.message)
  const rows = ((data ?? []) as { value: number | null; probability: number | null; expected_close_date: string | null; status: string }[]).filter(
    (row) => row.status === 'open' && row.expected_close_date && row.expected_close_date >= startDay && row.expected_close_date < endDay,
  )
  return {
    count: rows.length,
    weighted: rows.reduce((sum, row) => sum + (Number(row.value ?? 0) * Number(row.probability ?? 0)) / 100, 0),
    best: rows.reduce((sum, row) => sum + Number(row.value ?? 0), 0),
  }
}

export async function getHunterResult(): Promise<HunterResult> {
  const { start } = monthBounds()
  const { data, error } = await supabase
    .from('contacts')
    .select('id, origin, created_at, deals(status, value)')
    .eq('origin', 'Buyers Hunter')

  if (error) throw new Error(error.message)
  const contacts = ((data ?? []) as {
    origin: string | null
    created_at: string
    deals: { status: string; value: number | null }[] | null
  }[]).filter((contact) => contact.origin === 'Buyers Hunter')

  let withDeal = 0
  let won = 0
  let wonValue = 0
  for (const contact of contacts) {
    const deals = contact.deals ?? []
    if (deals.length > 0) withDeal++
    const wonDeals = deals.filter((deal) => deal.status === 'won')
    if (wonDeals.length > 0) won++
    wonValue += wonDeals.reduce((sum, deal) => sum + Number(deal.value ?? 0), 0)
  }

  // Tabela da migração 0011; sem ela, o card mostra só o funil.
  let searchesThisMonth: number | null = null
  const searches = await supabase
    .from('prospect_searches')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', start.toISOString())
  if (!searches.error) searchesThisMonth = searches.count ?? 0

  return {
    imported: contacts.length,
    importedThisMonth: contacts.filter((contact) => new Date(contact.created_at) >= start).length,
    withDeal,
    won,
    wonValue,
    searchesThisMonth,
  }
}
