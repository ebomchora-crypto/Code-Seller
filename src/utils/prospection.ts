import type {
  PotentialLevel,
  Prospect,
  ProspectFilters,
  ProspectOffer,
  ProspectScore,
  ScoredProspect,
  WebsiteKind,
} from '@/types'

export const OFFER_OPTIONS: { value: ProspectOffer; label: string }[] = [
  { value: 'site', label: 'Site institucional' },
  { value: 'landing', label: 'Landing page' },
  { value: 'system', label: 'Sistema' },
  { value: 'automation', label: 'Automação' },
]

export const WEBSITE_KIND_LABELS: Record<WebsiteKind, string> = {
  none: 'Sem site',
  social: 'Só redes sociais',
  site: 'Tem site',
}

export const POTENTIAL_LABELS: Record<PotentialLevel, string> = {
  high: 'Potencial alto',
  medium: 'Potencial médio',
  low: 'Potencial baixo',
}

export const DEFAULT_PROSPECT_FILTERS: ProspectFilters = {
  websiteKinds: [],
  minReviews: 0,
  minRating: 0,
  onlyWithPhone: false,
  hideImported: false,
  sort: 'potential',
}

// Celular brasileiro: DDD + 9 dígitos começando com 9 (com ou sem o 55).
export function isMobilePhone(phone: string | null | undefined): boolean {
  let digits = phone?.replace(/\D/g, '') ?? ''
  if (digits.length === 13 && digits.startsWith('55')) digits = digits.slice(2)
  return digits.length === 11 && digits[2] === '9'
}

function formatRating(rating: number): string {
  return rating.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

// Nota de 0 a 100 com os motivos à mostra — o usuário sempre vê por que uma
// empresa ficou no topo. Para quem vende site/landing, não ter site pesa mais;
// para sistema/automação, pesa mais o tamanho do movimento (avaliações).
export function scoreProspect(prospect: Prospect, offer: ProspectOffer): ProspectScore {
  const sellsWebsite = offer === 'site' || offer === 'landing'
  const reasons: string[] = []
  let score = 0

  if (prospect.website_kind === 'none') {
    score += sellsWebsite ? 45 : 20
    reasons.push('Sem site')
  } else if (prospect.website_kind === 'social') {
    score += sellsWebsite ? 35 : 20
    reasons.push('Só redes sociais')
  } else {
    score += sellsWebsite ? 5 : 15
    reasons.push('Já tem site')
  }

  const reviewSteps: [number, number, number][] = [
    [200, 25, 40],
    [80, 20, 32],
    [30, 14, 22],
    [10, 8, 12],
  ]
  const step = reviewSteps.find(([minimum]) => prospect.reviews >= minimum)
  score += step ? (sellsWebsite ? step[1] : step[2]) : sellsWebsite ? 2 : 4
  if (prospect.reviews >= 30) {
    reasons.push(`${prospect.reviews.toLocaleString('pt-BR')} avaliações`)
  } else if (prospect.reviews < 10) {
    reasons.push('Poucas avaliações')
  }

  if (prospect.rating !== null) {
    if (prospect.rating >= 4.5) score += 15
    else if (prospect.rating >= 4) score += 10
    else if (prospect.rating >= 3.5) score += 5
    if (prospect.rating >= 4.5) reasons.push(`Nota ${formatRating(prospect.rating)}`)
  }

  if (isMobilePhone(prospect.phone)) {
    score += 15
    reasons.push('Celular para WhatsApp')
  } else if (prospect.phone) {
    score += 10
    reasons.push('Tem telefone')
  }

  score = Math.min(100, score)
  const level: PotentialLevel = score >= 70 ? 'high' : score >= 45 ? 'medium' : 'low'
  return { score, level, reasons }
}

export function applyProspectFilters(
  prospects: ScoredProspect[],
  filters: ProspectFilters,
  importedIds: Set<string>,
): ScoredProspect[] {
  const filtered = prospects.filter((prospect) => {
    if (filters.websiteKinds.length > 0 && !filters.websiteKinds.includes(prospect.website_kind)) return false
    if (prospect.reviews < filters.minReviews) return false
    if (filters.minRating > 0 && (prospect.rating ?? 0) < filters.minRating) return false
    if (filters.onlyWithPhone && !prospect.phone) return false
    if (filters.hideImported && importedIds.has(prospect.id)) return false
    return true
  })

  const sorters: Record<ProspectFilters['sort'], (a: ScoredProspect, b: ScoredProspect) => number> = {
    potential: (a, b) => b.potential.score - a.potential.score || b.reviews - a.reviews,
    reviews: (a, b) => b.reviews - a.reviews,
    rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.reviews - a.reviews,
    name: (a, b) => a.name.localeCompare(b.name, 'pt-BR'),
  }

  return [...filtered].sort(sorters[filters.sort])
}

export function countActiveProspectFilters(filters: ProspectFilters): number {
  return (
    (filters.websiteKinds.length > 0 ? 1 : 0) +
    (filters.minReviews > 0 ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.onlyWithPhone ? 1 : 0) +
    (filters.hideImported ? 1 : 0)
  )
}
