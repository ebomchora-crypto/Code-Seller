import type { Contact, Interaction } from './crm'
import type { Deal, DealActivity } from './deals'
import type { Task } from './tasks'
import type { OnlineProposal } from './onlineProposal'

export type MessageRole = 'user' | 'assistant'

export type CommercialResponseMode = 'quick_reply' | 'analysis' | 'objection' | 'follow_up'

export interface LeadAnalysis {
  mode: CommercialResponseMode
  interest: 'Baixo' | 'Moderado' | 'Alto' | 'Indeterminado'
  stage: string
  evidence: string
  objection: string
  risk: string
  summary: string
  next_action: string
  reason: string
  strategy: string
  suggested_message: string
  next_step: string
  follow_up_at: string | null
}

export interface LeadContext {
  contact: Contact
  deals: Deal[]
  interactions: Interaction[]
  activities: DealActivity[]
  tasks: Task[]
  prototypes: Array<{ id: string; name: string; slug: string; status: string; published: boolean; created_at: string; brief?: Record<string, unknown> }>
  proposals: OnlineProposal[]
  previous_analysis: LeadAnalysis | null
  commercial_memory?: string | null
}

export type SalesPlaybook = 'none' | 'call_first' | 'whatsapp' | 'prototype_first' | 'lead_recovery' | 'follow_up'
export type CopilotTone = 'natural' | 'professional' | 'casual' | 'direct' | 'consultative' | 'formal'
export type CopilotLength = 'short' | 'medium' | 'detailed'
export type CopilotLanguage = 'auto' | 'pt_br' | 'pt_pt' | 'en' | 'es'

export interface CopilotPreferences {
  playbook: SalesPlaybook
  tone: CopilotTone
  length: CopilotLength
  language: CopilotLanguage
}

export const DEFAULT_COPILOT_PREFERENCES: CopilotPreferences = {
  playbook: 'none',
  tone: 'natural',
  length: 'medium',
  language: 'auto',
}

export type ActionType = 'create_task' | 'update_deal_stage' | 'create_interaction' | 'update_contact_status'

export type ActionStatus = 'pending' | 'confirmed' | 'rejected' | 'executed' | 'failed'

export interface ProposedAction {
  type: ActionType
  label: string
  description: string
  payload: Record<string, unknown>
  status: ActionStatus
}

// Arquivo anexado a uma mensagem do CS Copilot. Guarda o texto lido do
// documento e uma miniatura da imagem (a imagem inteira só vai para a IA).
export interface CopilotAttachment {
  name: string
  kind: 'image' | 'document'
  size: number
  text?: string
  thumb?: string
  truncated?: boolean
}

export interface AutoPilotMessage {
  analysis?: LeadAnalysis | null
  id: string
  conversation_id: string
  user_id: string
  role: MessageRole
  content: string // texto limpo (sem as tags <action>)
  actions: ProposedAction[] // ações extraídas da resposta
  attachments?: CopilotAttachment[]
  created_at: string
}

export interface AutoPilotConversation {
  contact_id?: string | null
  commercial_memory?: string | null
  preferences?: CopilotPreferences | null
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
  messages?: AutoPilotMessage[]
}

export interface AutoPilotContext {
  selected_lead?: LeadContext
  now?: string
  timezone?: string
  user: {
    name: string
    email: string
  }
  summary: {
    total_contacts: number
    active_deals: number
    pipeline_value: number
    conversion_rate: number
    pending_tasks: number
    overdue_tasks: number
    monthly_income: number
    monthly_expense: number
    receivables_total: number
  }
  recent_contacts: Array<{
    id: string
    name: string
    status: string
    niche: string | null
    last_interaction: string | null
  }>
  recent_interactions: Array<{
    id: string
    contact_id: string
    contact_name: string
    type: string
    content: string
    occurred_at: string
  }>
  active_deals: Array<{
    id: string
    title: string
    contact_name: string | null
    stage: string
    value: number | null
    currency?: string
    expected_close_date: string | null
    days_in_stage: number
  }>
  overdue_tasks: Array<{
    id: string
    title: string
    priority: string
    due_date: string
    contact_name: string | null
    deal_title: string | null
  }>
  stalled_deals: Array<{
    id: string
    title: string
    contact_name: string | null
    stage: string
    value: number | null
    last_activity_at: string | null
    days_stalled: number
  }>
}

// Prompts rápidos pré-definidos
export interface QuickPrompt {
  id: string
  label: string
  draft: string
  icon: string // nome do ícone Lucide
  category: 'analysis' | 'message' | 'task' | 'follow_up'
}
