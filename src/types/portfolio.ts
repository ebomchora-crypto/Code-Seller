// Sellers Portfolio — vitrine pública de trabalhos de cada usuário.

export type PortfolioCategory = 'site' | 'landing' | 'sistema' | 'automacao' | 'loja' | 'outro'

export interface Portfolio {
  user_id: string
  slug: string
  display_name: string
  headline: string | null
  bio: string | null
  avatar_url: string | null
  whatsapp: string | null
  city: string | null
  published: boolean
  views: number
  created_at: string
  updated_at: string
}

export interface PortfolioProject {
  id: string
  user_id: string
  title: string
  client_label: string | null
  category: PortfolioCategory
  description: string | null
  url: string | null
  image_url: string | null
  testimonial: string | null
  testimonial_author: string | null
  deal_id: string | null
  visible: boolean
  position: number
  created_at: string
  updated_at: string
}

export type PortfolioInput = Pick<Portfolio, 'slug' | 'display_name' | 'headline' | 'bio' | 'avatar_url' | 'whatsapp' | 'city'>

export type PortfolioProjectInput = Pick<
  PortfolioProject,
  'title' | 'client_label' | 'category' | 'description' | 'url' | 'image_url' | 'testimonial' | 'testimonial_author' | 'deal_id' | 'visible'
>

export type PublicPortfolio = Omit<Portfolio, 'user_id' | 'published' | 'created_at' | 'updated_at' | 'views'>

export type PublicPortfolioProject = Omit<PortfolioProject, 'user_id' | 'deal_id' | 'visible' | 'position' | 'created_at' | 'updated_at'>
