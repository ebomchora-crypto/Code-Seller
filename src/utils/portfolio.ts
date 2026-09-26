import type { PortfolioCategory } from '@/types'

export const PORTFOLIO_CATEGORY_LABELS: Record<PortfolioCategory, string> = {
  site: 'Site institucional',
  landing: 'Landing page',
  loja: 'Loja virtual',
  sistema: 'Sistema',
  automacao: 'Automação',
  outro: 'Outro',
}

// Mesma lista do banco (check em portfolios.slug) + alguns palavrões comuns.
const RESERVED = new Set([
  'admin', 'administrador', 'api', 'app', 'login', 'logout', 'register', 'cadastro', 'entrar',
  'suporte', 'support', 'settings', 'configuracoes', 'codesellers', 'code-sellers', 'code-seller',
  'buyers-hunter', 'buyershunter', 'portfolio', 'sellers-portfolio', 'oficial', 'equipe', 'root', 'null',
])
const BLOCKED_WORDS = ['porra', 'caralho', 'puta', 'merda', 'buceta', 'viado', 'fdp', 'bosta', 'cu-', 'piroca', 'foder']

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32)
    .replace(/-+$/g, '')
}

// Mensagem de erro em português, ou null se o apelido é válido.
export function validateSlug(slug: string): string | null {
  if (slug.length < 3) return 'Use pelo menos 3 caracteres.'
  if (slug.length > 32) return 'Use no máximo 32 caracteres.'
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])$/.test(slug)) return 'Use só letras minúsculas, números e hífen (sem começar ou terminar com hífen).'
  if (RESERVED.has(slug)) return 'Esse apelido é reservado. Escolha outro.'
  if (BLOCKED_WORDS.some((word) => slug.includes(word))) return 'Escolha um apelido sem palavrões.'
  return null
}

export function portfolioUrl(slug: string, origin = typeof window !== 'undefined' ? window.location.origin : 'https://codesellers.vercel.app') {
  return `${origin}/p/${slug}`
}
