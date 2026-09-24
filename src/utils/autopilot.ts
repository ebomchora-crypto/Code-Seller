import type { ActionType, AutoPilotContext, ProposedAction } from '@/types'

const ACTION_TAG_REGEX = /<action>([\s\S]*?)<\/action>/g
const VALID_ACTION_TYPES: ActionType[] = [
  'create_task',
  'update_deal_stage',
  'create_interaction',
  'update_contact_status',
]

interface ParsedResponse {
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
    console.warn('[AutoPilot] Bloco <action> malformado, ignorado:', raw)
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

  const text = rawContent
    .replace(ACTION_TAG_REGEX, (_match, inner: string) => {
      const action = parseActionBlock(inner.trim())
      if (!action) return ''
      actions.push(action)
      return `{{ACTION:${actions.length - 1}}}`
    })
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return { text, actions }
}

export function generateConversationTitle(firstMessage: string): string {
  const words = firstMessage.trim().split(/\s+/).slice(0, 5).join(' ')
  if (words.length <= 40) return words
  return `${words.slice(0, 40).trim()}...`
}

export function serializeContext(context: AutoPilotContext): string {
  return JSON.stringify(context)
}
