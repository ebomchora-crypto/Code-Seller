export type DealStage =
  | 'contact'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'closing'
  | 'won'
  | 'lost'

export type DealStatus = 'open' | 'won' | 'lost' | 'paused'

export type DealActivityType =
  | 'note'
  | 'call'
  | 'email'
  | 'whatsapp'
  | 'meeting'
  | 'stage_change'
  | 'proposal_sent'
  | 'other'

export interface DealActivity {
  id: string
  deal_id: string
  user_id: string
  type: DealActivityType
  content: string
  metadata?: Record<string, unknown>
  occurred_at: string
  created_at: string
}

export interface Deal {
  id: string
  user_id: string
  contact_id: string | null
  title: string
  value: number | null
  status: DealStatus
  stage: DealStage
  probability: number
  expected_close_date: string | null
  service: string | null
  notes: string | null
  origin: string | null
  proposal_url: string | null
  created_at: string
  updated_at: string
  // Relações opcionais (join)
  contact?: {
    id: string
    name: string
    email: string | null
    phone: string | null
  } | null
  activities?: DealActivity[]
}

export interface DealFilters {
  search: string
  stage: DealStage | 'all'
  status: DealStatus | 'all'
  origin: string
  service: string
}

export type DealsView = 'pipeline' | 'list'

// Métricas calculadas no frontend a partir dos deals carregados
export interface PipelineMetrics {
  total_deals: number
  total_value: number
  won_value: number
  lost_value: number
  open_value: number
  conversion_rate: number
  avg_deal_value: number
  deals_by_stage: Record<DealStage, { count: number; value: number }>
}

// Payload para geração de proposta com IA
export interface ProposalGenerationPayload {
  deal: Deal
  contact_name: string
  contact_niche: string | null
  user_name: string
  additional_context?: string
}

export const DEAL_STATUS_LABELS: Record<DealStatus, string> = {
  open: 'Em aberto',
  won: 'Ganho',
  lost: 'Perdido',
  paused: 'Pausado',
}

export const DEAL_ACTIVITY_TYPE_LABELS: Record<DealActivityType, string> = {
  note: 'Nota',
  call: 'Ligação',
  email: 'E-mail',
  whatsapp: 'WhatsApp',
  meeting: 'Reunião',
  stage_change: 'Mudança de etapa',
  proposal_sent: 'Proposta enviada',
  other: 'Outro',
}

export const SERVICE_SUGGESTIONS = [
  'Site Institucional',
  'Landing Page',
  'Loja Virtual',
  'Sistema',
  'Automação',
  'Manutenção',
  'Hospedagem',
  'Outro',
]
