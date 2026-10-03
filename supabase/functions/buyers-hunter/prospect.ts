export type WebsiteKind = 'none' | 'social' | 'site' | 'unknown'
export type WebsiteStatus = 'yes' | 'no' | 'unknown'
export type WebsiteSearch = 'all' | 'yes' | 'no'
export type ProviderWebsiteMode = 'allPlaces' | 'withWebsite' | 'withoutWebsite'

export interface ApifyPlace {
  placeId: string
  title?: string
  categoryName?: string
  address?: string
  city?: string
  state?: string
  countryCode?: string
  website?: string
  phone?: string
  phoneUnformatted?: string
  email?: string
  emails?: string[]
  totalScore?: number
  reviewsCount?: number
  url?: string
  permanentlyClosed?: boolean
  temporarilyClosed?: boolean
}

export interface NormalizedProspect {
  id: string
  name: string
  category: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  phone: string | null
  phone_international: string | null
  email: string | null
  website: string | null
  website_kind: WebsiteKind
  website_status: WebsiteStatus
  rating: number | null
  reviews: number
  maps_url: string | null
  source: string | null
  created_at: string | null
}

export interface ProviderRun {
  website: ProviderWebsiteMode
  maxResults: number
  provenance: ProviderWebsiteMode
}

const SOCIAL_HOSTS = [
  'instagram.com',
  'facebook.com',
  'fb.com',
  'linktr.ee',
  'linktree.com',
  'wa.me',
  'whatsapp.com',
  'api.whatsapp.com',
  'tiktok.com',
  'linkedin.com',
  'ifood.com.br',
  'goo.gl',
  'g.page',
  'business.site',
  'twitter.com',
  'x.com',
  'threads.net',
  'youtube.com',
  'youtu.be',
  'maps.app.goo.gl',
]

export function classifyWebsite(
  value: string | null | undefined,
  provenance: ProviderWebsiteMode,
): { kind: WebsiteKind; status: WebsiteStatus } {
  const candidate = value?.trim()
  if (!candidate) {
    return provenance === 'withoutWebsite'
      ? { kind: 'none', status: 'no' }
      : { kind: 'unknown', status: 'unknown' }
  }

  try {
    const parsed = new URL(candidate)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { kind: 'unknown', status: 'unknown' }
    }
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '')
    if (!host) return { kind: 'unknown', status: 'unknown' }
    const maps = /^maps\.google\.[a-z.]+$/.test(host) ||
      (/^google\.[a-z.]+$/.test(host) && /^\/maps(?:\/|$)/.test(parsed.pathname))
    const social = maps || SOCIAL_HOSTS.some((domain) => host === domain || host.endsWith(`.${domain}`))
    return social ? { kind: 'social', status: 'no' } : { kind: 'site', status: 'yes' }
  } catch {
    return { kind: 'unknown', status: 'unknown' }
  }
}

export function mergeProviderResults(prospects: NormalizedProspect[]): NormalizedProspect[] {
  const unique = new Map<string, NormalizedProspect>()
  const certainty = { unknown: 0, no: 1, yes: 2 }
  for (const prospect of prospects) {
    const existing = unique.get(prospect.id)
    if (!existing || certainty[prospect.website_status] > certainty[existing.website_status]) {
      unique.set(prospect.id, prospect)
    }
  }
  return [...unique.values()]
}

export function providerWebsiteMode(search: WebsiteSearch): ProviderWebsiteMode {
  if (search === 'yes') return 'withWebsite'
  if (search === 'no') return 'withoutWebsite'
  return 'allPlaces'
}

export function searchRuns(input: { website: WebsiteSearch; maxResults: number }): ProviderRun[] {
  if (input.website === 'no') {
    return [
      { website: 'withoutWebsite', maxResults: input.maxResults, provenance: 'withoutWebsite' },
      { website: 'withWebsite', maxResults: input.maxResults, provenance: 'withWebsite' },
    ]
  }
  const website = providerWebsiteMode(input.website)
  return [{ website, maxResults: input.maxResults, provenance: website }]
}

export function normalizePlace(
  place: ApifyPlace,
  provenance: ProviderWebsiteMode,
  createdAt: string,
): NormalizedProspect {
  const classification = classifyWebsite(place.website, provenance)
  return {
    id: place.placeId,
    name: place.title?.trim() || 'Empresa sem nome',
    category: place.categoryName ?? null,
    address: place.address ?? null,
    city: place.city ?? null,
    state: place.state ?? null,
    country: place.countryCode ?? null,
    phone: place.phone ?? null,
    phone_international: place.phoneUnformatted ?? null,
    email: place.email ?? place.emails?.[0] ?? null,
    website: place.website?.trim() || null,
    website_kind: classification.kind,
    website_status: classification.status,
    rating: place.totalScore ?? null,
    reviews: place.reviewsCount ?? 0,
    maps_url: place.url ?? null,
    source: 'Google Maps · Apify',
    created_at: createdAt,
  }
}

export function filterSearchResults<T extends { website_status: WebsiteStatus }>(
  prospects: T[],
  website: WebsiteSearch,
): T[] {
  if (website === 'all') return prospects
  return prospects.filter((prospect) => prospect.website_status === website)
}
