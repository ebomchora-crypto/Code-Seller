export interface CommercialPackage {
  name: string
  price: string
  includes: string
  deadline: string
}

// O que o usuário vende e como ele escreve. Alimenta o CS Copilot.
export interface CommercialProfile {
  services: string
  packages: CommercialPackage[]
  differentials: string
  niches: string
  results: string
  winning_messages: string
  writing_style: string
  signature: string
  updated_at?: string | null
}
