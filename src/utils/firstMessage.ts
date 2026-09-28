// Primeira mensagem pronta para cada empresa importada do Buyers Hunter,
// ajustada ao nicho, à situação do site e ao que você vende.
// Testado em src/utils/firstMessage.test.mjs.

import { normalizeChoice } from './choiceList.ts'

export type FirstMessageOffer = 'site' | 'landing' | 'system' | 'automation'
export type FirstMessageWebsite = 'none' | 'social' | 'site'

export interface FirstMessageInput {
  businessName: string
  niche?: string | null
  city?: string | null
  websiteKind?: FirstMessageWebsite | null
  rating?: number | null
  reviews?: number | null
  offer?: FirstMessageOffer | null
  myName?: string | null
  myCompany?: string | null
}

interface NicheGroup {
  match: string[]
  // O que o cliente desse nicho faz antes de escolher (vira o gancho).
  hook: string
}

const GROUPS: NicheGroup[] = [
  {
    match: ['barbear', 'salao', 'cabel', 'estetic', 'manicure', 'unha', 'sobrancelha', 'beleza', 'spa', 'maquiag', 'depila'],
    hook: 'hoje a maioria das pessoas escolhe onde cortar o cabelo ou fazer um procedimento pesquisando no celular e já quer ver fotos, preços e horários',
  },
  {
    match: ['clinic', 'dentist', 'odonto', 'fisio', 'psicolog', 'nutri', 'medic', 'saude', 'consultorio', 'fono', 'pediatr', 'dermato', 'laborat'],
    hook: 'quem procura um profissional de saúde quer confiar antes de marcar — e decide muito pelo que encontra na internet',
  },
  {
    match: ['oficina', 'mecanic', 'auto', 'funilar', 'borrachar', 'pneu', 'lava', 'moto', 'guincho'],
    hook: 'quando o carro dá problema, a pessoa pesquisa na hora uma oficina perto e liga para quem passa mais confiança',
  },
  {
    match: ['restaurante', 'lanchonete', 'padaria', 'pizzar', 'hamburg', 'cafe', 'bar', 'acai', 'doceria', 'confeitar', 'sorvet', 'marmit', 'delivery', 'aliment'],
    hook: 'muita gente decide onde comer olhando cardápio, fotos e horário pelo celular antes de sair de casa',
  },
  {
    match: ['advoca', 'advogad', 'juridic', 'contab', 'contador', 'consultor'],
    hook: 'quem precisa de um advogado ou contador pesquisa bastante antes de chamar, e um site bem feito passa a seriedade que esse serviço pede',
  },
  {
    match: ['academia', 'crossfit', 'pilates', 'personal', 'treino', 'fitness', 'yoga', 'luta', 'danca'],
    hook: 'quem quer começar a treinar compara planos, horários e estrutura pela internet antes de ir conhecer',
  },
  {
    match: ['pet', 'veterin', 'banho e tosa', 'canil'],
    hook: 'dono de pet é exigente e pesquisa bastante antes de confiar o animal a alguém',
  },
  {
    match: ['imobil', 'imove', 'corretor', 'construt', 'constru', 'reforma', 'arquitet', 'engenh', 'marcenar', 'serralher', 'vidrac', 'eletric', 'encanad'],
    hook: 'antes de fechar um serviço desses, o cliente quer ver trabalhos anteriores e sentir segurança',
  },
  {
    match: ['escola', 'curso', 'idioma', 'ingles', 'educa', 'colegio', 'creche', 'reforco'],
    hook: 'os pais e alunos comparam escolas e cursos pela internet antes de pedir uma visita',
  },
  {
    match: ['loja', 'roupa', 'moda', 'calcad', 'boutique', 'otica', 'joalher', 'presente', 'papelar', 'magazine', 'varejo'],
    hook: 'muita venda começa com o cliente pesquisando o produto pelo celular antes de ir até a loja',
  },
]

const FALLBACK_HOOK = 'hoje a maioria dos clientes pesquisa pela internet antes de escolher com quem fechar'

const OFFER_LINES: Record<FirstMessageOffer, string> = {
  site: 'Eu faço sites profissionais para negócios locais, que aparecem nas buscas e levam o cliente direto para o WhatsApp.',
  landing: 'Eu crio páginas de venda simples e rápidas, feitas para transformar quem visita em contato no WhatsApp.',
  system: 'Eu desenvolvo sistemas sob medida para organizar agenda, clientes e pedidos sem planilha e sem papel.',
  automation: 'Eu monto automações no WhatsApp que respondem na hora, agendam e confirmam horários sozinhas.',
}

function hookFor(niche: string | null | undefined): string {
  const key = normalizeChoice(niche ?? '')
  if (!key) return FALLBACK_HOOK
  return GROUPS.find((group) => group.match.some((word) => key.includes(word)))?.hook ?? FALLBACK_HOOK
}

function situationLine(input: FirstMessageInput): string {
  const offer = input.offer ?? 'site'
  const sellsWebsite = offer === 'site' || offer === 'landing'
  const rating = input.rating ?? 0
  const reviews = input.reviews ?? 0
  const reputation =
    reviews >= 30 && rating >= 4.5
      ? ` Vocês já têm ${reviews.toLocaleString('pt-BR')} avaliações com nota ${rating.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} — isso merece ser mostrado.`
      : ''

  if (sellsWebsite) {
    if (input.websiteKind === 'none') return `Vi que vocês ainda não têm um site.${reputation}`
    if (input.websiteKind === 'social') return `Vi que hoje vocês aparecem só pelas redes sociais.${reputation}`
    return `Dei uma olhada no site de vocês e vi alguns pontos que dá para melhorar.${reputation}`
  }
  return reputation ? reputation.trim() : 'Vi que o movimento de vocês é bom.'
}

export function buildFirstMessage(input: FirstMessageInput): string {
  const firstName = input.myName?.trim().split(/\s+/)[0]
  const intro = firstName
    ? `Oi, tudo bem? Aqui é ${firstName}${input.myCompany ? `, da ${input.myCompany}` : ''}.`
    : 'Oi, tudo bem?'
  const place = input.city ? ` aqui em ${input.city}` : ''
  const hook = hookFor(input.niche)
  const situation = situationLine(input)

  return [
    intro,
    // "o perfil de vocês" evita errar o gênero do nome ("a Restaurante…").
    `Encontrei o perfil de vocês${place} e ${situation.charAt(0).toLowerCase()}${situation.slice(1)}`,
    `${hook.charAt(0).toUpperCase()}${hook.slice(1)}. ${OFFER_LINES[input.offer ?? 'site']}`,
    'Posso te mostrar em 2 minutos como ficaria para vocês?',
  ].join('\n\n')
}

// Mensagem guardada na descrição da tarefa ("Mensagem pronta:" / "Mensagem
// sugerida:"), para o botão "Enviar no WhatsApp".
export function extractTaskMessage(description: string | null | undefined): string | null {
  const match = description?.match(/Mensagem (?:pronta|sugerida):\n([\s\S]*?)(?:\n\n(?:Abra|Toque|Use) [^\n]*)?\s*$/)
  const message = match?.[1]?.trim()
  return message || null
}
