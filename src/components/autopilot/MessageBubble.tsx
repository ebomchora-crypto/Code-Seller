import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { CalendarPlus, Check, Copy, RotateCw } from 'lucide-react'
import { toast } from 'sonner'
import { ActionBlock } from '@/components/autopilot/ActionBlock'
import { CopilotOrb } from '@/components/autopilot/CopilotOrb'
import type { AutoPilotMessage, Contact } from '@/types'
import { LeadAnalysisCard } from './LeadAnalysisCard'

interface MessageBubbleProps {
  contact?: Contact
  onContextChanged?: () => void
  message: AutoPilotMessage
  onConfirmAction: (actionIndex: number) => void
  onRejectAction: (actionIndex: number) => void
  onRequestVariation: (instruction: string, responseContent: string) => void
  sending: boolean
}

const ACTION_MARKER_REGEX = /\{\{ACTION:(\d+)\}\}/g

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function MessageBubble({ message, onConfirmAction, onRejectAction, onRequestVariation: requestVariation, sending, contact, onContextChanged }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'
  const onRequestVariation = (instruction: string, content: string) =>
    requestVariation(instruction, (contact && message.analysis?.suggested_message) || content)

  async function handleCopy() {
    try { await navigator.clipboard.writeText((contact && message.analysis?.suggested_message) || message.content.replace(ACTION_MARKER_REGEX, '').trim()) }
    catch { toast.error('Não foi possível copiar.'); return }
    setCopied(true)
    toast.success('Texto copiado.')
    setTimeout(() => setCopied(false), 1500)
  }

  if (isUser) {
    return (
      <div className="flex animate-float-up justify-end">
        <div className="max-w-[85%] sm:max-w-[75%]">
          <div className="rounded-[20px] rounded-br-md bg-[linear-gradient(135deg,#8b5cf6,#6d28d9)] px-4 py-3 text-white shadow-[0_12px_30px_-14px_rgba(124,58,237,0.9)]">
            <p className="whitespace-pre-wrap text-[14.5px] leading-relaxed">{message.content}</p>
          </div>
          <p className="mt-1 px-1 text-right text-[11px] text-[var(--text-muted)]">{formatTime(message.created_at)}</p>
        </div>
      </div>
    )
  }

  // Divide o conteúdo nos marcadores {{ACTION:N}} para renderizar cada
  // ActionBlock exatamente onde a IA posicionou a ação no texto.
  const segments = message.content.split(ACTION_MARKER_REGEX)

  return (
    <div className="group flex animate-float-up justify-start gap-3">
      <CopilotOrb size="sm" />

      <div className="min-w-0 flex-1">
        <p className="mb-1.5 flex items-center gap-2 text-[12.5px]">
          <span className="font-semibold text-[var(--text-primary)]">CS Copilot</span>
          <span className="text-[var(--text-muted)]">{formatTime(message.created_at)}</span>
        </p>
        <div className="text-[var(--text-primary)]">
          {contact && message.analysis && <LeadAnalysisCard message={message} contact={contact} sending={sending} onPrompt={onRequestVariation} onSaved={() => onContextChanged?.()} />}
          {segments.map((segment, index) => {
            if (index % 2 === 1) {
              const actionIndex = Number(segment)
              const action = message.actions[actionIndex]
              if (!action) return null
              return (
                <div key={`action-${actionIndex}`} className="my-3">
                  <ActionBlock
                    action={action}
                    onConfirm={() => onConfirmAction(actionIndex)}
                    onReject={() => onRejectAction(actionIndex)}
                  />
                </div>
              )
            }

            if (!segment.trim()) return null

            return (
              <div key={`text-${index}`} className="autopilot-markdown text-[14.5px] leading-relaxed">
                <ReactMarkdown>{segment}</ReactMarkdown>
              </div>
            )
          })}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-default)] px-2.5 py-1 text-[11.5px] text-[var(--text-muted)] transition-all duration-150 hover:text-[var(--text-primary)]"
            aria-label="Copiar mensagem"
          >
            {copied ? (
              <Check className="size-3 text-emerald-500" />
            ) : (
              <Copy className="size-3" />
            )}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
          {!isUser && (
            <div className="flex flex-wrap items-center gap-1.5">
              <button type="button" disabled={sending} onClick={() => onRequestVariation('Gere outra versão desta resposta, preservando os fatos e a intenção do pedido.', message.content)} title="Gerar outra versão" aria-label="Gerar outra versão" className="inline-flex h-7 items-center gap-1 rounded-lg px-2 text-[11.5px] text-[var(--text-muted)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-50">
                <RotateCw className="size-3.5" /> Outra versão
              </button>
              <button type="button" disabled={sending} onClick={() => onRequestVariation('Deixe esta resposta mais curta, sem perder o objetivo.', message.content)} className="inline-flex h-7 items-center rounded-lg px-2 text-[11.5px] text-[var(--text-muted)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-50">Mais curta</button>
              <button type="button" disabled={sending} onClick={() => onRequestVariation('Reescreva esta resposta de forma mais natural.', message.content)} className="inline-flex h-7 items-center rounded-lg px-2 text-[11.5px] text-[var(--text-muted)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-50">Mais natural</button>
              <button type="button" disabled={sending} onClick={() => onRequestVariation('Reescreva esta resposta com tom mais profissional, sem ficar rígida.', message.content)} className="inline-flex h-7 items-center rounded-lg px-2 text-[11.5px] text-[var(--text-muted)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-50">Mais profissional</button>
              {contact && <button type="button" disabled={sending} onClick={() => onRequestVariation('Prepare um follow-up adequado ao histórico. Se houver contexto suficiente e um contato correspondente no CRM, sugira também uma tarefa de follow-up com data segura; se faltar data ou identificação do contato, pergunte antes de propor a tarefa.', message.content)} title="Agendar follow-up" aria-label="Agendar follow-up" className="inline-flex h-7 items-center gap-1 rounded-lg px-2 text-[11.5px] text-[var(--text-muted)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-50">
                <CalendarPlus className="size-3.5" /> Agendar follow-up
              </button>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
