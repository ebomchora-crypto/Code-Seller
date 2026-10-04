import type { ActionType, AutoPilotContext, ProposedAction } from '@/types'
import { leadContextForAI } from './aiLeadContext'
import { parseLeadAnalysis } from './copilotCRM'
import type { LeadAnalysis } from '@/types'

const ACTION_TAG_REGEX = /<action>([\s\S]*?)<\/action>/g
const COMMERCIAL_RESPONSE_TAG_REGEX = /<(commercial_response|lead_analysis)>([\s\S]*?)<\/\1>/g
const MESSAGE_TAG_REGEX = /<mensagem_pronta>([\s\S]*?)<\/mensagem_pronta>/gi
/** Onde a mensagem pronta (com os botões de copiar/enviar) aparece no texto. */
export const MESSAGE_MARKER = '{{MESSAGE}}'
const VALID_ACTION_TYPES: ActionType[] = [
  'create_task',
  'update_deal_stage',
  'create_interaction',
  'update_contact_status',
]

interface ParsedResponse {
  analysis: LeadAnalysis | null
  text: string
  actions: Omit<ProposedAction, 'status'>[]
}

function isValidActionType(value: unknown): value is ActionType {
  return typeof value === 'string' && (VALID_ACTION_TYPES as string[]).includes(value)
}

function parseActionBlock(raw: string): Omit<ProposedAction, 'status'> | null {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null

    const candidate = parsed as Record<string, unknown>
    if (!isValidActionType(candidate.type)) return null
    if (typeof candidate.label !== 'string' || !candidate.label.trim()) return null
    if (typeof candidate.description !== 'string') return null
    if (typeof candidate.payload !== 'object' || candidate.payload === null) return null

    return {
      type: candidate.type,
      label: candidate.label,
      description: candidate.description,
      payload: candidate.payload as Record<string, unknown>,
    }
  } catch {
    // JSON malformado — ignoramos a action em vez de quebrar o chat.
    console.warn('[CS Copilot] Bloco <action> malformado, ignorado:', raw)
    return null
  }
}

// Parseia a resposta bruta da IA: extrai blocos <action>...</action>, valida
// cada um e retorna o texto limpo junto com as ações válidas. Um bloco
// malformado ou com campos inválidos é descartado silenciosamente (com aviso
// no console) em vez de quebrar a renderização da mensagem.
//
// Cada tag <action> válida é substituída por um marcador `{{ACTION:N}}` (N =
// índice em `actions`) em vez de ser simplesmente removida, para que a UI
// (MessageBubble) possa renderizar o ActionBlock na posição exata onde a IA
// o colocou no texto, não apenas no final da mensagem.
export function parseAutoPilotResponse(rawContent: string): ParsedResponse {
  const actions: Omit<ProposedAction, 'status'>[] = []
  let analysis: LeadAnalysis | null = null

  const tagged: string[] = []
  const withoutAnalysis = rawContent
    .replace(COMMERCIAL_RESPONSE_TAG_REGEX, (_match, _tag: string, inner: string) => {
      try { analysis = parseLeadAnalysis(JSON.parse(inner)) } catch { /* Keep the readable response on malformed output. */ }
      return ''
    })
  const found = analysis as LeadAnalysis | null
  // A mensagem pronta vem no meio do texto: a primeira vira o cartão com os
  // botões (quando há análise); sem análise, ou as demais, viram citação.
  const text = withoutAnalysis
    .replace(MESSAGE_TAG_REGEX, (_match, inner: string) => {
      const message = inner.trim()
      if (!message) return ''
      tagged.push(message)
      if (found && tagged.length === 1) return `\n\n${MESSAGE_MARKER}\n\n`
      return `\n\n${message.split('\n').map((line) => `> ${line}`).join('\n')}\n\n`
    })
    .replace(ACTION_TAG_REGEX, (_match, inner: string) => {
      const action = parseActionBlock(inner.trim())
      if (!action) return ''
      actions.push(action)
      return `{{ACTION:${actions.length - 1}}}`
    })
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  const result = analysis as LeadAnalysis | null
  if (result && !result.suggested_message.trim() && tagged[0]) result.suggested_message = tagged[0]
  return { text, actions, analysis: result }
}

// Texto que está chegando ao vivo: esconde blocos internos ainda incompletos
// e mostra a mensagem pronta como citação enquanto ela é escrita.
export function streamingPreview(raw: string): string {
  let text = raw
  const hidden = text.search(/<(?:commercial_response|lead_analysis|action)\b/i)
  if (hidden >= 0) text = text.slice(0, hidden)
  text = text.replace(/<mensagem_pronta>([\s\S]*?)(?:<\/mensagem_pronta>|$)/gi, (_match, inner: string) => {
    const message = inner.replace(/<\/?m[a-z_]*$/i, '').trim()
    return message ? `\n\n${message.split('\n').map((line) => `> ${line}`).join('\n')}\n\n` : '\n\n'
  })
  // Tag pela metade no fim ("<mens", "<commer"...): ainda não mostra.
  return text.replace(/<[a-z_/]*$/i, '').replace(/\n{3,}/g, '\n\n').trimStart()
}

export function generateConversationTitle(firstMessage: string): string {
  const words = firstMessage.trim().split(/\s+/).slice(0, 5).join(' ')
  if (words.length <= 40) return words
  return `${words.slice(0, 40).trim()}...`
}

export function serializeContext(context: AutoPilotContext): string {
  const lead = context.selected_lead
  if (!lead) return JSON.stringify(context)
  return JSON.stringify({ ...context, selected_lead: leadContextForAI(lead) })
}
