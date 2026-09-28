import type { Deal } from './deals'

export type ContactStatus = 'lead' | 'negotiating' | 'client' | 'inactive' | 'lost'
export type InteractionType = 'note' | 'call' | 'email' | 'whatsapp' | 'meeting' | 'proposal' | 'other'

export interface Tag {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export interface Interaction {
  id: string
  contact_id: string
  user_id: string
  type: InteractionType
  content: string
  occurred_at: string
  created_at: string
}

export interface Contact {
  id: string
  user_id: string
  name: string
  email: string | null
  phone: string | null
  niche: string | null
  city: string | null
  state: string | null
  status: ContactStatus
  origin: string | null
  notes: string | null
  current_site: string | null
  assigned_to: string | null
  // Empresa de origem no Buyers Hunter (evita importar a mesma duas vezes)
  place_id?: string | null
  created_at: string
  updated_at: string
  // Relações opcionais (join)
  tags?: Tag[]
  interactions?: Interaction[]
  deals?: Deal[]
}

export interface ContactFilters {
  search: string
  status: ContactStatus | 'all'
  niche: string
  origin: string
  tag_id: string
}

export type CRMView = 'list' | 'kanban'

export const CONTACT_STATUSES: ContactStatus[] = ['lead', 'negotiating', 'client', 'inactive', 'lost']

export const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  lead: 'Lead',
  negotiating: 'Negociando',
  client: 'Cliente',
  inactive: 'Inativo',
  lost: 'Perdido',
}

export const INTERACTION_TYPE_LABELS: Record<InteractionType, string> = {
  note: 'Nota',
  call: 'Ligação',
  email: 'E-mail',
  whatsapp: 'WhatsApp',
  meeting: 'Reunião',
  proposal: 'Proposta',
  other: 'Outro',
}

// Nichos mais comuns para quem vende site/serviço digital para negócio local.
// A pessoa ainda pode digitar qualquer outro.
export const NICHE_SUGGESTIONS = [
  'Oficina mecânica',
  'Barbearia',
  'Salão de beleza',
  'Clínica',
  'Advocacia',
  'Dentista',
  'Esteticista',
  'Restaurante',
  'Lanchonete',
  'Academia',
  'Pet shop',
  'Imobiliária',
  'Contabilidade',
  'Psicólogo',
  'Nutricionista',
  'Fisioterapia',
  'Loja de roupas',
  'Padaria',
  'Escola',
  'Construção e reforma',
  'Arquitetura',
  'Fotografia',
]

// Por onde o lead chegou. Os valores antigos (Cold Call, Outros…) continuam
// iguais para os filtros acharem os contatos já cadastrados.
export const ORIGIN_SUGGESTIONS = [
  'Buyers Hunter',
  'Indicação',
  'Instagram',
  'WhatsApp',
  'Google',
  'Facebook',
  'TikTok',
  'LinkedIn',
  'Site',
  'Formulário',
  'Anúncio pago',
  'Cold Call',
  'Visita presencial',
  'Evento',
  'E-mail',
  'Cliente antigo',
  'Parceiro',
  'Outros',
]

export const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]
