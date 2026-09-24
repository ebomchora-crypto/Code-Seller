import { supabase } from '@/lib/supabaseClient'

export interface UsageStats {
  contacts: number
  active_deals: number
  storage_bytes: number
}

const USAGE_BUCKETS = ['avatars', 'proposals', 'receipts'] as const

// Estimativa de uso de Storage: soma o tamanho dos arquivos nas pastas do
// usuário nos buckets usados pelo app. `storage.list()` não é recursivo, então
// descemos um nível de subpasta (proposals/receipts organizam arquivos por
// deal_id/transaction_id) — cobre o uso real do app, mas é uma estimativa,
// não uma contagem exaustiva de todo o Storage.
async function getStorageUsageBytes(userId: string): Promise<number> {
  let totalBytes = 0

  for (const bucket of USAGE_BUCKETS) {
    const { data: topLevel } = await supabase.storage.from(bucket).list(userId)
    if (!topLevel) continue

    for (const entry of topLevel) {
      if (entry.metadata?.size) {
        totalBytes += entry.metadata.size as number
      } else {
        const { data: nested } = await supabase.storage.from(bucket).list(`${userId}/${entry.name}`)
        for (const nestedEntry of nested ?? []) {
          if (nestedEntry.metadata?.size) totalBytes += nestedEntry.metadata.size as number
        }
      }
    }
  }

  return totalBytes
}

export async function getUsageStats(): Promise<UsageStats> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw new Error(userError.message)
  if (!userData.user) throw new Error('Usuário não autenticado.')

  const [contactsResult, dealsResult, storageBytes] = await Promise.all([
    supabase.from('contacts').select('id', { count: 'exact', head: true }),
    supabase.from('deals').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    getStorageUsageBytes(userData.user.id),
  ])

  return {
    contacts: contactsResult.count ?? 0,
    active_deals: dealsResult.count ?? 0,
    storage_bytes: storageBytes,
  }
}
