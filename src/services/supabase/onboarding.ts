import { supabase } from '@/lib/supabaseClient'

// Contagens usadas pelos "Primeiros passos" do Início. Tabela que ainda não
// existe (migração pendente) conta como zero.
//
// Usa GET com limit(1) em vez de HEAD: alguns navegadores, extensões e redes
// corporativas bloqueiam ou cortam respostas HEAD sem Content-Length (visto
// em teste real de produção: as mesmas chamadas com HEAD falhavam com
// net::ERR_ABORTED, enquanto GET com o mesmo filtro funcionava sempre). O
// total exato continua vindo do cabeçalho Content-Range, então o custo extra
// é de no máximo 1 linha por chamada.
async function countRows(table: string, filter?: { column: string; value: string }): Promise<number> {
  let query = supabase.from(table).select('id', { count: 'exact' }).limit(1)
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
