// ============================================================================
// Detecção de duplicatas — Buyers Hunter
//
// Prioridade de identificação:
// 1. Google Place ID (id)
// 2. Telefone (dígitos normalizados)
// 3. Website (URL normalizada)
// 4. Nome + Endereço/Cidade (texto normalizado)
// ============================================================================

import type { Prospect } from '@/types'

function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return ''
  return phone.replace(/\D/g, '')
}

function normalizeUrl(url: string | null | undefined): string {
  if (!url) return ''
  return url
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
    .trim()
}

function normalizeText(text: string | null | undefined): string {
  if (!text) return ''
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

export function deduplicateProspects<T extends Prospect>(prospects: T[]): T[] {
  const seen = new Set<string>()
  const unique: T[] = []

  for (const prospect of prospects) {
    const keys: string[] = []

    if (prospect.id) {
      keys.push(`id:${prospect.id}`)
    }

    const phone = normalizePhone(prospect.phone)
    if (phone.length >= 8) {
      keys.push(`phone:${phone}`)
    }

    const website = normalizeUrl(prospect.website)
    if (website && prospect.website_kind === 'site') {
      keys.push(`web:${website}`)
    }

    const nameCity = `name:${normalizeText(prospect.name)}:${normalizeText(prospect.city || prospect.address)}`
    if (normalizeText(prospect.name)) {
      keys.push(nameCity)
    }

    const isDuplicate = keys.some((k) => seen.has(k))

    if (!isDuplicate) {
      for (const k of keys) seen.add(k)
      unique.push(prospect)
    }
  }

  return unique
}
