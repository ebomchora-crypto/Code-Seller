export type MessageRole = 'user' | 'assistant'

export type ActionType = 'create_task' | 'update_deal_stage' | 'create_interaction' | 'update_contact_status'

export type ActionStatus = 'pending' | 'confirmed' | 'rejected' | 'executed' | 'failed'

export interface ProposedAction {
  type: ActionType
  label: string
  description: string
  payload: Record<string, unknown>
  status: ActionStatus
}

export interface AutoPilotMessage {
  id: string
  conversation_id: string
  user_id: string
  role: MessageRole
  content: string // texto limpo (sem as tags <action>)
  actions: ProposedAction[] // ações extraídas da resposta
  created_at: string
}

export interface AutoPilotConversation {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
  messages?: AutoPilotMessage[]
}

export interface AutoPilotContext {
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
  active_deals: Array<{
    id: string
    title: string
    contact_name: string | null
    stage: string
    value: number | null
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
  prompt: string
  icon: string // nome do ícone Lucide
  category: 'analysis' | 'message' | 'task' | 'follow_up'
}
