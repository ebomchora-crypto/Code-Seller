import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { CalendarPlus, Check, Copy, FileText, RotateCw } from 'lucide-react'
import { toast } from 'sonner'
import { ActionBlock } from '@/components/autopilot/ActionBlock'
import { CopilotOrb } from '@/components/autopilot/CopilotOrb'
import type { AutoPilotMessage, Contact, CopilotAttachment } from '@/types'
import { DEFAULT_ATTACHMENT_PROMPT, formatFileSize } from '@/utils/copilotAttachments'
import { MESSAGE_MARKER } from '@/utils/autopilot'
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

// Arquivos que o usuário anexou: miniatura das imagens e etiqueta dos documentos.
function MessageAttachments({ attachments }: { attachments: CopilotAttachment[] }) {
  return (
    <div className="mb-1.5 flex flex-wrap justify-end gap-2">
      {attachments.map((file, index) =>
        file.thumb ? (
          <img
            key={index}
            src={file.thumb}
            alt={file.name}
            title={file.name}
            className="size-24 rounded-2xl border border-[var(--border-subtle)] object-cover sm:size-28"
          />
        ) : (
          <div
            key={index}
            title={file.name}
            className="flex h-14 max-w-[240px] items-center gap-2.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] pl-2 pr-3.5"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-tint)] text-[var(--accent-text)]">
              <FileText className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[12.5px] font-medium text-[var(--text-primary)]">{file.name}</span>
              <span className="block text-[11px] text-[var(--text-muted)]">{formatFileSize(file.size)}</span>
            </span>
          </div>
        ),
      )}
    </div>
  )
}

export function MessageBubble({ message, onConfirmAction, onRejectAction, onRequestVariation: requestVariation, sending, contact, onContextChanged }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'
  const onRequestVariation = (instruction: string, content: string) =>
    requestVariation(instruction, message.analysis?.suggested_message || content)

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
        <div className="flex max-w-[85%] flex-col items-end sm:max-w-[75%]">
          {message.attachments && message.attachments.length > 0 && <MessageAttachments attachments={message.attachments} />}
          {!(message.attachments?.length && message.content === DEFAULT_ATTACHMENT_PROMPT) && (
            <div className="rounded-[20px] rounded-br-md bg-[linear-gradient(135deg,#8b5cf6,#6d28d9)] px-4 py-3 text-white shadow-[0_12px_30px_-14px_rgba(124,58,237,0.9)]">
              <p className="whitespace-pre-wrap text-[14.5px] leading-relaxed">{message.content}</p>
            </div>
          )}
          <p className="mt-1 px-1 text-right text-[11px] text-[var(--text-muted)]">{formatTime(message.created_at)}</p>
        </div>
      </div>
    )
  }

  // Divide o conteúdo nos marcadores {{ACTION:N}} para renderizar cada
  // ActionBlock exatamente onde a IA posicionou a ação no texto.
  function renderText(content: string, keyPrefix: string) {
    return content.split(ACTION_MARKER_REGEX).map((segment, index) => {
      if (index % 2 === 1) {
        const actionIndex = Number(segment)
        const action = message.actions[actionIndex]
        if (!action) return null
        return (
          <div key={`${keyPrefix}-action-${actionIndex}`} className="my-3">
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
        <div key={`${keyPrefix}-text-${index}`} className="autopilot-markdown text-[14.5px] leading-relaxed">
          <ReactMarkdown>{segment}</ReactMarkdown>
        </div>
      )
    })
  }

  // Resposta em conversa (texto + mensagem pronta no meio) ou, nas respostas
  // antigas, só o cartão de análise.
  const [beforeMessage, ...afterParts] = message.content.split(MESSAGE_MARKER)
  const afterMessage = afterParts.join('')
  const hasProse = message.content.replace(ACTION_MARKER_REGEX, '').split(MESSAGE_MARKER).join('').trim().length > 0
  const cardProps = { message, contact, sending, onPrompt: onRequestVariation, onSaved: () => onContextChanged?.() }

  return (
    <div className="group flex animate-float-up justify-start gap-3">
      <CopilotOrb size="sm" />

      <div className="min-w-0 flex-1">
        <p className="mb-1.5 flex items-center gap-2 text-[12.5px]">
          <span className="font-semibold text-[var(--text-primary)]">CS Copilot</span>
          <span className="text-[var(--text-muted)]">{formatTime(message.created_at)}</span>
        </p>
        <div className="text-[var(--text-primary)]">
          {message.analysis && !hasProse ? (
            <>
              <LeadAnalysisCard {...cardProps} />
              {renderText(message.content, 'legacy')}
            </>
          ) : (
            <>
              {renderText(beforeMessage, 'before')}
              {message.analysis && <LeadAnalysisCard {...cardProps} variant="message" />}
              {renderText(afterMessage, 'after')}
              {message.analysis && <LeadAnalysisCard {...cardProps} variant="footer" />}
            </>
          )}
        </div>

        {!message.analysis && <div className="mt-2 flex flex-wrap items-center gap-3">
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
              {contact && <button type="button" disabled={sending} onClick={() => onRequestVariation('Prepare um follow-up adequado ao histórico. Se houver contexto suficiente e um contato correspondente no CRM, sugira também uma tarefa de follow-up com data segura; se faltar data ou identificação do contato, pergunte antes de propor a tarefa.', message.content)} title="Agendar follow-up" aria-label="Agendar follow-up" className="inline-flex h-7 items-center gap-1 rounded-lg px-2 text-[11.5px] text-[var(--text-muted)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-50">
                <CalendarPlus className="size-3.5" /> Agendar follow-up
              </button>}
            </div>
          )}
        </div>}
      </div>
    </div>
  )
}
