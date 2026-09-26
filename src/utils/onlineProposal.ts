import type { OnlineProposal, OnlineProposalStatus, ProposalOption, ProposalResponseError } from '@/types'

export const MAX_PROPOSAL_OPTIONS = 3

export const ONLINE_PROPOSAL_STATUS: Record<OnlineProposalStatus, { label: string; tone: 'muted' | 'info' | 'success' | 'danger' }> = {
  sent: { label: 'Enviada', tone: 'muted' },
  viewed: { label: 'Visualizada', tone: 'info' },
  approved: { label: 'Aprovada', tone: 'success' },
  declined: { label: 'Recusada', tone: 'danger' },
  cancelled: { label: 'Cancelada', tone: 'muted' },
}

export const RESPONSE_ERROR_MESSAGES: Record<ProposalResponseError, string> = {
  not_found: 'Esta proposta não está mais disponível.',
  already_answered: 'Esta proposta já foi respondida.',
  expired: 'O prazo desta proposta terminou. Fale com quem enviou para receber uma nova.',
  name_required: 'Informe seu nome para aprovar.',
  invalid_option: 'Escolha uma das opções para aprovar.',
}

let optionCounter = 0
export function newOptionId(): string {
  optionCounter += 1
  return `${Date.now().toString(36)}${optionCounter.toString(36)}`
}

export function defaultOptions(dealValue: number | null): ProposalOption[] {
  const base = dealValue && dealValue > 0 ? dealValue : null
  return [
    { id: newOptionId(), name: 'Essencial', description: '', price: base ? Math.round(base * 0.6) : null, recommended: false },
    { id: newOptionId(), name: 'Profissional', description: '', price: base, recommended: true },
    { id: newOptionId(), name: 'Completo', description: '', price: base ? Math.round(base * 1.4) : null, recommended: false },
  ]
}

export interface ProposalDraft {
  title: string
  options: ProposalOption[]
}

// Retorna a primeira mensagem de erro, ou null se dá para criar o link.
export function validateProposalDraft(draft: ProposalDraft): string | null {
  if (!draft.title.trim()) return 'Dê um título para a proposta.'
  if (draft.options.length === 0) return 'Adicione pelo menos uma opção.'
  if (draft.options.length > MAX_PROPOSAL_OPTIONS) return `Use no máximo ${MAX_PROPOSAL_OPTIONS} opções.`
  for (const [index, option] of draft.options.entries()) {
    if (!option.name.trim()) return `Dê um nome para a opção ${index + 1}.`
    if (option.price === null || !Number.isFinite(option.price) || option.price <= 0) return `Informe o valor da opção "${option.name.trim()}".`
  }
  return null
}

// Converte "2.400,50", "2400.5" ou "R$ 2.400" em número (null se vazio/ inválido).
export function parsePrice(value: string): number | null {
  const cleaned = value.replace(/[^\d,.]/g, '')
  if (!cleaned) return null
  const normalized = cleaned.includes(',') ? cleaned.replace(/\./g, '').replace(',', '.') : /\.\d{3}$/.test(cleaned) ? cleaned.replace(/\./g, '') : cleaned
  const number = Number(normalized)
  return Number.isFinite(number) ? Math.round(number * 100) / 100 : null
}

export function validUntilFromDays(days: number | null, from: Date = new Date()): string | null {
  if (!days) return null
  const date = new Date(from)
  date.setDate(date.getDate() + days)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function proposalLink(token: string, origin: string = window.location.origin): string {
  return `${origin}/proposta/${token}`
}

export function proposalWhatsappMessage(link: string): string {
  return `Oi! Segue a proposta: ${link}\n\nPor lá você vê as opções, escolhe a que faz mais sentido e já pode aprovar. Qualquer dúvida, é só me chamar.`
}

export function isProposalOpen(proposal: Pick<OnlineProposal, 'status'>): boolean {
  return proposal.status === 'sent' || proposal.status === 'viewed'
}

// Tira o título (# …) e a seção de investimento de um modelo do Kit: na proposta
// online os valores ficam nas opções.
export function kitBodyForOnline(markdown: string): string {
  const withoutTitle = markdown.replace(/^#\s+.*\n+/, '')
  return withoutTitle.replace(/## Investimento[\s\S]*?(?=\n## |$)/, '').replace(/\n{3,}/g, '\n\n').trim()
}
