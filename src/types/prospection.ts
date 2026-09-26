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

export interface ProspectSearchParams {
  niche: string
  city: string
  offer: ProspectOffer
}

export interface ProspectSearchResponse {
  results: Prospect[]
  nextPageToken: string | null
  usage: ProspectUsage
}

export interface RecentProspectSearch {
  niche: string
  city: string
  offer: ProspectOffer | null
  created_at: string
}

export interface ProspectFilters {
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
  | 'upstream_error'
  | 'internal'
