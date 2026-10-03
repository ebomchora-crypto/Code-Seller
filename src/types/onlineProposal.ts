// Proposta online: link público em que o cliente escolhe uma opção e aprova.

export interface ProposalOption {
  id: string
  name: string
  description: string
  price: number | null
  recommended: boolean
}

export type OnlineProposalStatus = 'sent' | 'viewed' | 'approved' | 'declined' | 'cancelled'

export interface OnlineProposal {
  id: string
  user_id: string
  deal_id: string
  token: string
  title: string
  client_name: string | null
  body: string
  options: ProposalOption[]
  payment_terms: string | null
  valid_until: string | null
  status: OnlineProposalStatus
  chosen_option_id: string | null
  chosen_option_name: string | null
  chosen_price: number | null
  /** Moeda dos preços (a mesma do negócio). */
  currency?: string
  responder_name: string | null
  response_note: string | null
  views: number
  first_viewed_at: string | null
  last_viewed_at: string | null
  responded_at: string | null
  created_at: string
  updated_at: string
}

export interface PublicProposalSeller {
  name: string | null
  company: string | null
  avatar_url: string | null
  logo_url: string | null
  whatsapp: string | null
  portfolio_slug: string | null
}

export interface PublicProposal {
  title: string
  client_name: string | null
  body: string
  options: ProposalOption[]
  currency?: string
  payment_terms: string | null
  valid_until: string | null
  expired: boolean
  status: OnlineProposalStatus
  chosen_option_id: string | null
  responder_name: string | null
  responded_at: string | null
  created_at: string
  seller: PublicProposalSeller
}

export type ProposalResponseError = 'not_found' | 'already_answered' | 'expired' | 'name_required' | 'invalid_option'
