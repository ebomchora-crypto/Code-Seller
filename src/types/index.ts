// Usuário autenticado (dados normalizados a partir da sessão do Supabase)
export interface AuthUser {
  id: string
  email: string
  name?: string
  avatar_url?: string
  created_at: string
}

// Envelope padrão de resposta para chamadas de serviço (Supabase, APIs externas)
export interface ServiceResponse<T> {
  data: T | null
  error: string | null
  loading: boolean
}

// Estados possíveis de uma página ou seção assíncrona
export type PageState = 'idle' | 'loading' | 'success' | 'error' | 'empty'

export * from './crm'
export * from './deals'
export * from './dashboard'
export * from './financial'
export * from './tasks'
export * from './autopilot'
export * from './settings'
export * from './support'
export * from './prospection'
export * from './revenue'
export * from './templates'
export * from './portfolio'
