import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import type {
  Prospect,
  ProspectErrorCode,
  ProspectSearchParams,
  ProspectSearchResponse,
  ProspectUsage,
  RecentProspectSearch,
} from '@/types'

export class ProspectError extends Error {
  code: ProspectErrorCode

  constructor(code: ProspectErrorCode, message: string) {
    super(message)
    this.code = code
  }
}

interface FunctionErrorBody {
  error?: { code?: ProspectErrorCode; message?: string }
}

async function invokeHunter<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>('buyers-hunter', { body })

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const payload = (await error.context.json().catch(() => null)) as FunctionErrorBody | null
      if (payload?.error) {
        throw new ProspectError(payload.error.code ?? 'internal', payload.error.message ?? 'Erro na busca.')
      }
    }
    // Function ainda não publicada ou rede fora: a busca não está disponível.
    throw new ProspectError('not_configured', 'A busca ainda não está disponível.')
  }

  if (!data) throw new ProspectError('internal', 'A busca não retornou dados.')
  return data
}

export function getProspectUsage(): Promise<ProspectUsage> {
  return invokeHunter<ProspectUsage>({ action: 'usage' })
}

export function searchProspects(params: ProspectSearchParams, pageToken?: string | null): Promise<ProspectSearchResponse> {
  return invokeHunter<ProspectSearchResponse>({ action: 'search', ...params, pageToken: pageToken ?? undefined })
}

// Últimas buscas sem repetir o mesmo nicho + cidade.
export async function getRecentSearches(limit = 6): Promise<RecentProspectSearch[]> {
  const { data, error } = await supabase
    .from('prospect_searches')
    .select('niche, city, offer, created_at')
    .order('created_at', { ascending: false })
    .limit(40)

  if (error) throw new Error(error.message)

  const seen = new Set<string>()
  const recent: RecentProspectSearch[] = []
  for (const row of (data ?? []) as RecentProspectSearch[]) {
    const key = `${row.niche.toLowerCase()}|${row.city.toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)
    recent.push(row)
    if (recent.length >= limit) break
  }
  return recent
}

export async function getDismissedIds(): Promise<Set<string>> {
  const { data, error } = await supabase.from('prospect_dismissed').select('place_id')
  if (error) throw new Error(error.message)
  return new Set((data ?? []).map((row: { place_id: string }) => row.place_id))
}

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw new Error(error.message)
  if (!data.user) throw new Error('Usuário não autenticado.')
  return data.user.id
}

export async function dismissProspect(placeId: string): Promise<void> {
  const userId = await currentUserId()
  const { error } = await supabase.from('prospect_dismissed').upsert({ user_id: userId, place_id: placeId })
  if (error) throw new Error(error.message)
}

export async function restoreProspect(placeId: string): Promise<void> {
  const { error } = await supabase.from('prospect_dismissed').delete().eq('place_id', placeId)
  if (error) throw new Error(error.message)
}

// place_id → id do contato, para as empresas da busca que já estão no CRM.
export async function getImportedContacts(placeIds: string[]): Promise<Map<string, string>> {
  if (placeIds.length === 0) return new Map()
  const { data, error } = await supabase.from('contacts').select('id, place_id').in('place_id', placeIds)
  if (error) throw new Error(error.message)
  return new Map((data ?? []).map((row: { id: string; place_id: string }) => [row.place_id, row.id]))
}

export async function importProspects(prospects: Prospect[], niche: string): Promise<Map<string, string>> {
  if (prospects.length === 0) return new Map()
  const userId = await currentUserId()
  const today = new Date().toLocaleDateString('pt-BR')

  const rows = prospects.map((prospect) => ({
    user_id: userId,
    name: prospect.name,
    phone: prospect.phone,
    niche: prospect.category ?? niche,
    city: prospect.city,
    state: prospect.state && prospect.state.length === 2 ? prospect.state : null,
    status: 'lead',
    origin: 'Buyers Hunter',
    current_site: prospect.website,
    place_id: prospect.id,
    notes: [`Encontrada pelo Buyers Hunter em ${today}.`, prospect.address].filter(Boolean).join('\n'),
  }))

  const { data, error } = await supabase.from('contacts').insert(rows).select('id, place_id')
  if (error) throw new Error(error.message)
  return new Map((data ?? []).map((row: { id: string; place_id: string }) => [row.place_id, row.id]))
}
