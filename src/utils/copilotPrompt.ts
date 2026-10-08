import type { CopilotPreferences } from '@/types'
import type { CommercialProfile } from '@/types/commercialProfile'
import { KIT_SCRIPTS } from '../data/academy/kit.ts'
import { commercialProfilePrompt } from './commercialProfile.ts'
import { commercialRequestGuidance } from './copilotGuidance.ts'

// Parte da instrução do CS Copilot que muda por conversa. As regras
// permanentes (metodologia, técnicas, nichos, formato) ficam no servidor
// (supabase/functions/ai-chat/copilotPrompt.ts) e são juntadas lá.

export const COPILOT_PROMPT_VERSION = 2

const TONE: Record<CopilotPreferences['tone'], string> = {
  natural: 'natural, como conversa de WhatsApp',
  professional: 'profissional, sem ficar formal demais',
  casual: 'descontraído',
  direct: 'direto, sem rodeios',
  consultative: 'consultivo, com perguntas que fazem o cliente pensar',
  formal: 'formal e educado',
}
const LENGTH: Record<CopilotPreferences['length'], string> = {
  short: 'curto: vá direto ao ponto',
  medium: 'proporcional ao pedido',
  detailed: 'mais detalhado quando o caso pedir explicação',
}
const LANGUAGE: Record<CopilotPreferences['language'], string> = {
  auto: 'automático: português do Brasil, ou o idioma/variante que o usuário pedir ou que o lead usar (lead de Portugal → português de Portugal)',
  pt_br: 'português do Brasil',
  pt_pt: 'português de Portugal (vocabulário e tratamento de Portugal)',
  en: 'inglês nas mensagens para o lead; explicações ao usuário em português',
  es: 'espanhol nas mensagens para o lead; explicações ao usuário em português',
}
const PLAYBOOK: Record<Exclude<CopilotPreferences['playbook'], 'none'>, string> = {
  call_first: 'Call First: com interesse, priorize uma breve reunião para entender o caso e apresentar valor; o WhatsApp serve para criar confiança e combinar a conversa. Adapte se o cliente não quiser reunião ou pedir preço repetidamente.',
  whatsapp: 'Venda pelo WhatsApp: conduza a venda por mensagens, com perguntas e próximos passos claros; só proponha reunião se o cliente abrir espaço.',
  prototype_first: 'Protótipo Primeiro: quando pertinente, use uma prévia como ponto de partida, deixando claro que é demonstrativa e pode mudar. Não presuma que todo serviço permite protótipo.',
  lead_recovery: 'Recuperação de Lead: retome leads antigos com contexto e algo novo, sem fingir urgência.',
  follow_up: 'Follow-up: retome conversas paradas com mensagem proporcional ao tempo e ao histórico, sempre acrescentando algo.',
}

function preferencesBlock(preferences: CopilotPreferences): string {
  const lines = [
    `- Tom: ${TONE[preferences.tone] ?? TONE.natural}.`,
    `- Tamanho: ${LENGTH[preferences.length] ?? LENGTH.medium}.`,
    `- Idioma: ${LANGUAGE[preferences.language] ?? LANGUAGE.auto}.`,
    preferences.playbook && preferences.playbook !== 'none'
      ? `- Playbook escolhido (muda a ênfase; a metodologia continua valendo): ${PLAYBOOK[preferences.playbook]}`
      : '- Playbook: nenhum; use a metodologia sem impor tática. Consultas ao CRM e perguntas gerais não precisam virar análise de negociação.',
  ]
  return `PREFERÊNCIAS:\n${lines.join('\n')}`
}

// Perfil comercial do usuário (nunca é resumido junto do CRM).
export function profileInstructions(profile: CommercialProfile | null | undefined): string {
  const block = commercialProfilePrompt(profile)
  if (!block) {
    return 'PERFIL COMERCIAL DO USUÁRIO: ainda não preenchido. Não invente preços, pacotes, prazos, garantias nem resultados de clientes. Quando precisar de preço, use só os valores registrados no negócio ou deixe [valor] para o usuário completar.'
  }
  return `${block}

REGRAS DO PERFIL COMERCIAL:
- Ofertas, diferenciais e nichos vêm do perfil acima; adapte ao lead sem prometer o que não está lá.
- Preços: cite apenas os do perfil ou os registrados no negócio. Nunca invente valor, desconto ou condição de pagamento.
- Resultados de clientes: use apenas os listados, sem aumentar números.
- Mensagens sugeridas seguem o jeito de escrever e as mensagens que funcionaram do usuário, sem perder a metodologia.
- Assinatura: só use se estiver definida, e apenas quando fizer sentido no canal.`
}

// Scripts de abordagem e follow-up do Kit (a mesma fonte da Área do aluno).
export const KIT_REFERENCES = KIT_SCRIPTS
  .filter((script) => script.category === 'abordagem' || script.category === 'follow_up')
  .map((script) => `- ${script.title} (${script.whenToUse}): “${script.text}”`)
  .join('\n')

export function copilotConversationInstructions(preferences: CopilotPreferences, profile: CommercialProfile | null | undefined,
  userMessage: string): string {
  return [
    preferencesBlock(preferences),
    profileInstructions(profile),
    `MODELOS DO KIT DO USUÁRIO (referência de tom e estrutura; adapte ao lead e ao idioma, nunca copie):\n${KIT_REFERENCES}`,
    `ORIENTAÇÃO DO PEDIDO ATUAL (leitura automática do pedido; o histórico e o contexto têm a palavra final):\n${commercialRequestGuidance(userMessage)}`,
  ].join('\n\n')
}
