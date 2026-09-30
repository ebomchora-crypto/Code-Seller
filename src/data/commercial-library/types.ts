export type CommercialCategory = 'scripts' | 'objections' | 'followups' | 'copies' | 'prompts' | 'universal'
export type CommercialStage = 'interesse' | 'previa' | 'reuniao' | 'diagnostico' | 'valor' | 'preco' | 'follow_up' | 'fechamento' | 'recuperacao'

export interface CommercialMaterial {
  id: string
  category: CommercialCategory
  title: string
  stage: CommercialStage
  tags: string[]
  strategy: string
  body: string
  meaning?: string
  avoid?: string
  goal?: string
  short?: string
  consultative?: string
  next?: string
}
