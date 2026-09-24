// FAQ estático
export interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
}

// Artigo da central de ajuda (estático)
export interface HelpArticle {
  id: string
  title: string
  summary: string
  content: string
  category: string
  icon: string
}

// Item do changelog (estático)
export interface ChangelogItem {
  version: string
  date: string
  title: string
  description: string
  type: 'feature' | 'improvement' | 'fix' | 'breaking'
  items: string[]
}

// Status do sistema (estático/mockado)
export interface SystemStatus {
  service: string
  status: 'operational' | 'degraded' | 'outage'
  message?: string
}
