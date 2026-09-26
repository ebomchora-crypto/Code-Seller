import { supabase } from '@/lib/supabaseClient'

// Contagens usadas pelos "Primeiros passos" do Início. Tabela que ainda não
// existe (migração pendente) conta como zero.
async function countRows(table: string, filter?: { column: string; value: string }): Promise<number> {
  let query = supabase.from(table).select('id', { count: 'exact', head: true })
  if (filter) query = query.eq(filter.column, filter.value)
  const { count, error } = await query
  if (error) return 0
  return count ?? 0
}

export interface OnboardingCounts {
  contacts: number
  deals: number
  hunter: number
  devices: number
  conversations: number
}

export async function getOnboardingCounts(): Promise<OnboardingCounts> {
  const [contacts, deals, searches, hunterContacts, devices, conversations] = await Promise.all([
    countRows('contacts'),
    countRows('deals'),
    countRows('prospect_searches'),
    countRows('contacts', { column: 'origin', value: 'Buyers Hunter' }),
    countRows('push_subscriptions'),
    countRows('autopilot_conversations'),
  ])
  return { contacts, deals, hunter: searches + hunterContacts, devices, conversations }
}
