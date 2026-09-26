export type Theme = 'light' | 'dark' | 'system'
export type Language = 'pt-BR' | 'en-US'
export type IntegrationType = 'whatsapp' | 'google_calendar' | 'google_contacts' | 'zapier' | 'webhook'
export type IntegrationStatus = 'connected' | 'disconnected' | 'error'

export interface UserProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  company_name: string | null
  company_logo_url: string | null
  website: string | null
  bio: string | null
  timezone: string
  language: Language
  theme: Theme
  // Migração 0013
  monthly_goal?: number | null
  onboarding_dismissed_at?: string | null
  // Migração 0015
  followup_enabled?: boolean
  followup_days?: number[]
  created_at: string
  updated_at: string
}

export interface PipelineStage {
  id: string
  user_id: string
  name: string
  color: string
  position: number
  default_probability: number
  is_won: boolean
  is_lost: boolean
  created_at: string
}

export interface CRMStatus {
  id: string
  user_id: string
  name: string
  color: string
  position: number
  is_default: boolean
  created_at: string
}

export interface NotificationPreferences {
  id: string
  user_id: string
  task_reminders: boolean
  deal_updates: boolean
  contact_updates: boolean
  financial_alerts: boolean
  overdue_tasks: boolean
  stalled_deals: boolean
  weekly_summary: boolean
  // Migração 0013
  daily_summary?: boolean
  daily_summary_hour?: number
  created_at: string
  updated_at: string
}

export interface Integration {
  id: string
  user_id: string
  type: IntegrationType
  status: IntegrationStatus
  config: Record<string, unknown> | null
  connected_at: string | null
  created_at: string
  updated_at: string
}

// Configuração de integração para exibição
export interface IntegrationConfig {
  type: IntegrationType
  label: string
  description: string
  icon: string // nome do ícone Lucide
  status: IntegrationStatus
  connected_at: string | null
  docs_url: string
}
