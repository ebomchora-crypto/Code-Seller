// Buyers Hunter — prospecção de empresas.

export type WebsiteKind = 'none' | 'social' | 'site'

// O que o usuário vende muda o peso de cada sinal na nota de potencial.
export type ProspectOffer = 'site' | 'landing' | 'system' | 'automation'

export interface Prospect {
  id: string
  name: string
  category: string | null
  address: string | null
  city: string | null
  state: string | null
  phone: string | null
  phone_international: string | null
  /** País da empresa (ISO de 2 letras). */
  country?: string | null
  website: string | null
  website_kind: WebsiteKind
  rating: number | null
  reviews: number
  maps_url: string | null
}

export type PotentialLevel = 'high' | 'medium' | 'low'

export interface ProspectScore {
  score: number
  level: PotentialLevel
  reasons: string[]
}

export interface ScoredProspect extends Prospect {
  potential: ProspectScore
}

export interface ProspectUsage {
  configured: boolean
  used: number
  limit: number
}

export const MAX_LEADS_PER_SEARCH = 30
export const LEADS_OPTIONS = [10, 20, MAX_LEADS_PER_SEARCH] as const
export const DEFAULT_LEADS_COUNT = 20

export interface ProspectSearchParams {
  niche: string
  city: string
  /** Estado / província / distrito (opcional). */
  state?: string
  /** País da busca (ISO de 2 letras, padrão BR). */
  country?: string
  offer: ProspectOffer
  /** Quantos leads trazer nesta busca (1 a MAX_LEADS_PER_SEARCH). */
  maxResults: number
}

export interface ProspectSearchResponse {
  results: Prospect[]
  usage: ProspectUsage
}

export interface RecentProspectSearch {
  niche: string
  city: string
  state?: string | null
  country?: string | null
  offer: ProspectOffer | null
  created_at: string
}

export interface ProspectFilters {
  hasWebsite?: 'all' | 'yes' | 'no'
  websiteKinds: WebsiteKind[]
  minReviews: number
  minRating: number
  onlyWithPhone: boolean
  hideImported: boolean
  sort: 'potential' | 'reviews' | 'rating' | 'name'
}

export type ProspectErrorCode =
  | 'not_configured'
  | 'limit_reached'
  | 'invalid_input'
  | 'unauthorized'
  | 'no_access'
  | 'upstream_error'
  | 'internal'
