import type { ImageCrop, PortfolioCategory } from '@/types'

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

// ---------------------------------------------------------------------------
// Ajuste da imagem do projeto no quadro 16:10 (arrastar, zoom, inteira).
// ---------------------------------------------------------------------------

export const COVER_ASPECT = 16 / 10
export const MAX_ZOOM = 3
export const DEFAULT_CROP: ImageCrop = { x: 50, y: 50, zoom: 1, fit: 'cover' }

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

// Aceita qualquer coisa vinda do banco e devolve um ajuste válido.
export function normalizeCrop(input: unknown): ImageCrop {
  const raw = (input && typeof input === 'object' ? input : {}) as Partial<Record<keyof ImageCrop, unknown>>
  const number = (value: unknown, fallback: number) => (typeof value === 'number' && Number.isFinite(value) ? value : fallback)
  return {
    x: clamp(number(raw.x, 50), 0, 100),
    y: clamp(number(raw.y, 50), 0, 100),
    zoom: clamp(number(raw.zoom, 1), 1, MAX_ZOOM),
    fit: raw.fit === 'contain' ? 'contain' : 'cover',
  }
}

// Ajuste inicial de uma imagem nova: print de página inteira (mais alto que o
// quadro) começa mostrando o topo do site; o resto começa centralizado.
export function initialCrop(naturalWidth: number, naturalHeight: number): ImageCrop {
  const tall = naturalWidth > 0 && naturalHeight / naturalWidth > (1 / COVER_ASPECT) * 1.15
  return { ...DEFAULT_CROP, y: tall ? 0 : 50 }
}

// Estilo da <img class="object-cover"> para o ajuste: o ponto (x, y) da imagem
// fica no ponto (x, y) do quadro e o zoom cresce a partir dele.
export function cropStyle(crop: ImageCrop): { objectPosition: string; transform?: string; transformOrigin?: string } {
  const position = `${crop.x}% ${crop.y}%`
  return crop.zoom > 1 ? { objectPosition: position, transform: `scale(${crop.zoom})`, transformOrigin: position } : { objectPosition: position }
}

// Quanto da imagem sobra para fora do quadro (em px), em cada direção.
export function cropOverflow(
  frame: { width: number; height: number },
  natural: { width: number; height: number },
  zoom: number,
): { x: number; y: number } {
  if (!natural.width || !natural.height) return { x: 0, y: 0 }
  const scale = Math.max(frame.width / natural.width, frame.height / natural.height) * zoom
  return {
    x: Math.max(0, natural.width * scale - frame.width),
    y: Math.max(0, natural.height * scale - frame.height),
  }
}

// Arrastar a imagem (dx, dy em px) → novo ponto x/y. Arrastar para a direita
// revela mais do lado esquerdo, por isso o sinal invertido.
export function dragCrop(crop: ImageCrop, dx: number, dy: number, overflow: { x: number; y: number }): ImageCrop {
  return {
    ...crop,
    x: overflow.x > 0 ? clamp(crop.x - (dx / overflow.x) * 100, 0, 100) : crop.x,
    y: overflow.y > 0 ? clamp(crop.y - (dy / overflow.y) * 100, 0, 100) : crop.y,
  }
}
