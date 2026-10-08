import type { AutoPilotMessage, LeadAnalysis } from '@/types'
import { attachmentsPromptBlock } from './copilotAttachments.ts'

// Histórico que volta para a IA a cada envio. No banco, a resposta do Copilot
// guarda o texto com o marcador {{MESSAGE}} (onde fica o cartão da mensagem
// pronta) e a mensagem em analysis.suggested_message. Sem remontar, a IA nunca
// via a mensagem que ela mesma escreveu: não conseguia melhorar "a mensagem
// anterior", repetia frases e fazia o usuário repetir o que já tinha dito.

const MESSAGE_MARKER = '{{MESSAGE}}'
const ACTION_MARKER = /\{\{ACTION:(\d+)\}\}/g

export interface HistoryMessage {
  role: 'user' | 'assistant'
  content: string
}

function filled(value: string | null | undefined): value is string {
  return Boolean(value && value.trim() && !/^(?:n[aã]o (?:identificad[ao]|informad[ao])|indeterminad[ao])$/i.test(value.trim()))
}

// Leitura registrada da resposta (etapa, interesse, objeção, próximo passo),
// para a IA não perder o que já concluiu nem o usuário precisar repetir.
export function analysisNote(analysis: LeadAnalysis | null | undefined): string {
  if (!analysis) return ''
  const parts = [
    filled(analysis.stage) && `etapa: ${analysis.stage}`,
    analysis.interest && analysis.interest !== 'Indeterminado' && `interesse: ${analysis.interest}`,
    filled(analysis.objection) && `objeção: ${analysis.objection}`,
    filled(analysis.next_step) && `próximo passo: ${analysis.next_step}`,
  ].filter(Boolean)
  return parts.length ? `[Leitura registrada nesta resposta — ${parts.join('; ')}]` : ''
}

function assistantContent(message: AutoPilotMessage): string {
  const suggested = message.analysis?.suggested_message?.trim() ?? ''
  const tagged = suggested ? `<mensagem_pronta>\n${suggested}\n</mensagem_pronta>` : ''
  let content = message.content
  if (content.includes(MESSAGE_MARKER)) content = content.replace(MESSAGE_MARKER, () => tagged)
  else if (tagged && !content.includes(suggested)) content = `${content}\n\n${tagged}`
  content = content.replace(ACTION_MARKER, (_match, index: string) => {
    const action = message.actions[Number(index)]
    return action ? `[ação proposta (${action.type}): ${action.label} — status ${action.status}]` : ''
  })
  const note = analysisNote(message.analysis)
  return [content.replace(/\n{3,}/g, '\n\n').trim(), note].filter(Boolean).join('\n\n')
}

export function historyForModel(messages: AutoPilotMessage[]): HistoryMessage[] {
  return messages.map((message) => {
    if (message.role === 'assistant') return { role: 'assistant', content: assistantContent(message) }
    return { role: 'user', content: message.content + attachmentsPromptBlock(message.attachments, 'history') }
  })
}
