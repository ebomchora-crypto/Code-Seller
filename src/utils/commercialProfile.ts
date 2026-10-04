import type { CommercialPackage, CommercialProfile } from '@/types/commercialProfile'

// Limites iguais aos do banco (migração 0042).
export const COMMERCIAL_LIMITS = {
  services: 1500,
  differentials: 1500,
  niches: 800,
  results: 1500,
  winning_messages: 6000,
  writing_style: 800,
  signature: 120,
  packages: 6,
  packageName: 60,
  packagePrice: 40,
  packageIncludes: 400,
  packageDeadline: 40,
} as const

export const EMPTY_COMMERCIAL_PROFILE: CommercialProfile = {
  services: '',
  packages: [],
  differentials: '',
  niches: '',
  results: '',
  winning_messages: '',
  writing_style: '',
  signature: '',
  updated_at: null,
}

function text(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function normalizePackage(value: unknown): CommercialPackage | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>
  const pkg = {
    name: text(item.name, COMMERCIAL_LIMITS.packageName),
    price: text(item.price, COMMERCIAL_LIMITS.packagePrice),
    includes: text(item.includes, COMMERCIAL_LIMITS.packageIncludes),
    deadline: text(item.deadline, COMMERCIAL_LIMITS.packageDeadline),
  }
  return pkg.name || pkg.price || pkg.includes || pkg.deadline ? pkg : null
}

// Limpa espaços, corta no limite e descarta pacotes vazios.
export function normalizeCommercialProfile(value: unknown): CommercialProfile {
  const row = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
  const packages = Array.isArray(row.packages)
    ? row.packages.map(normalizePackage).filter((item): item is CommercialPackage => item !== null).slice(0, COMMERCIAL_LIMITS.packages)
    : []
  return {
    services: text(row.services, COMMERCIAL_LIMITS.services),
    packages,
    differentials: text(row.differentials, COMMERCIAL_LIMITS.differentials),
    niches: text(row.niches, COMMERCIAL_LIMITS.niches),
    results: text(row.results, COMMERCIAL_LIMITS.results),
    winning_messages: text(row.winning_messages, COMMERCIAL_LIMITS.winning_messages),
    writing_style: text(row.writing_style, COMMERCIAL_LIMITS.writing_style),
    signature: text(row.signature, COMMERCIAL_LIMITS.signature),
    updated_at: typeof row.updated_at === 'string' ? row.updated_at : null,
  }
}

// O que já está preenchido, para mostrar o progresso na tela.
export function commercialProfileProgress(profile: CommercialProfile | null | undefined) {
  const p = profile ?? EMPTY_COMMERCIAL_PROFILE
  const items = [
    Boolean(p.services),
    p.packages.some((pkg) => pkg.price),
    Boolean(p.differentials),
    Boolean(p.niches),
    Boolean(p.results),
    Boolean(p.winning_messages),
    Boolean(p.writing_style),
  ]
  return { done: items.filter(Boolean).length, total: items.length }
}

export function isCommercialProfileEmpty(profile: CommercialProfile | null | undefined): boolean {
  return commercialProfileProgress(profile).done === 0
}

function formatPackage(pkg: CommercialPackage): string {
  const head = [pkg.name || 'Pacote', pkg.price].filter(Boolean).join(' — ')
  const extra = [pkg.includes && `inclui: ${pkg.includes}`, pkg.deadline && `prazo: ${pkg.deadline}`].filter(Boolean).join('; ')
  return `- ${head}${extra ? ` (${extra})` : ''}`
}

// Bloco que entra nas instruções do CS Copilot. Vazio quando não há perfil.
export function commercialProfilePrompt(profile: CommercialProfile | null | undefined): string {
  if (!profile || isCommercialProfileEmpty(profile)) return ''
  const parts: string[] = []
  if (profile.services) parts.push(`O que vende:\n${profile.services}`)
  if (profile.packages.length) parts.push(`Pacotes e preços (os ÚNICOS preços que você pode citar, além dos valores do negócio):\n${profile.packages.map(formatPackage).join('\n')}`)
  if (profile.differentials) parts.push(`Diferenciais e garantias:\n${profile.differentials}`)
  if (profile.niches) parts.push(`Nichos e regiões que atende:\n${profile.niches}`)
  if (profile.results) parts.push(`Resultados reais de clientes (use como prova, sem exagerar nem inventar números):\n${profile.results}`)
  if (profile.writing_style) parts.push(`Jeito de escrever do usuário:\n${profile.writing_style}`)
  if (profile.signature) parts.push(`Como assina as mensagens: ${profile.signature}`)

  let block = `PERFIL COMERCIAL DO USUÁRIO (fonte de verdade sobre a oferta dele)\n${parts.join('\n\n')}`
  if (profile.winning_messages) {
    block += `\n\nMENSAGENS DO USUÁRIO QUE FUNCIONARAM (imite o tom, a forma, o tamanho e o vocabulário; não copie literalmente, adapte ao lead)\n${profile.winning_messages}`
  }
  return block
}
