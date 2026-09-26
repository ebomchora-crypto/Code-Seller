import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { ActionBlock } from '@/components/autopilot/ActionBlock'
import { CopilotOrb } from '@/components/autopilot/CopilotOrb'
import type { AutoPilotMessage } from '@/types'

interface MessageBubbleProps {
  message: AutoPilotMessage
  onConfirmAction: (actionIndex: number) => void
  onRejectAction: (actionIndex: number) => void
}

const ACTION_MARKER_REGEX = /\{\{ACTION:(\d+)\}\}/g

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function MessageBubble({ message, onConfirmAction, onRejectAction }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  async function handleCopy() {
    await navigator.clipboard.writeText(message.content.replace(ACTION_MARKER_REGEX, '').trim())
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

        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-default)] px-2.5 py-1 text-[11.5px] text-[var(--text-muted)] opacity-0 transition-all duration-150 hover:text-[var(--text-primary)] focus:opacity-100 group-hover:opacity-100"
            aria-label="Copiar mensagem"
          >
            {copied ? (
              <Check className="size-3 text-emerald-500" />
            ) : (
              <Copy className="size-3" />
            )}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      </div>
    </div>
  )
}
