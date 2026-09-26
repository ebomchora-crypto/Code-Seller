// Modelos de mensagem (WhatsApp) com variáveis preenchidas pelo app.

export type TemplateCategory = 'abordagem' | 'follow_up' | 'proposta' | 'cobranca' | 'outro'

export interface MessageTemplate {
  id: string
  user_id: string
  name: string
  category: TemplateCategory
  body: string
  position: number
  created_at: string
  updated_at: string
}

export interface TemplateContext {
  nome?: string | null
  cidade?: string | null
  nicho?: string | null
  negocio?: string | null
  valor?: number | null
  meu_nome?: string | null
  minha_empresa?: string | null
}
