// Área do aluno — tipos do conteúdo (lições e Kit).

export type AcademyModuleId = 'criar' | 'encontrar' | 'vender'

export interface AcademyModule {
  id: AcademyModuleId
  title: string
  subtitle: string
  color: string
}

export interface AcademyLesson {
  id: string
  module: AcademyModuleId
  title: string
  summary: string
  minutes: number
  /** Markdown da lição. */
  body: string
  /** Exemplo real, mostrado em destaque. */
  example?: { title: string; text: string }
  /** "O que fazer agora" — cada item vira um check salvo no progresso. */
  checklist: string[]
  /** Opcional: link do YouTube para quando houver vídeo. */
  videoUrl?: string
}

export type KitPromptCategory = 'site' | 'landing' | 'sistema' | 'revisao'

export interface KitPrompt {
  id: string
  title: string
  category: KitPromptCategory
  description: string
  text: string
}

export interface KitScript {
  id: string
  title: string
  category: 'abordagem' | 'follow_up' | 'proposta' | 'cobranca'
  whenToUse: string
  text: string
}

export interface KitProposal {
  id: string
  title: string
  description: string
  /** Markdown com campos entre colchetes para preencher. */
  body: string
}
