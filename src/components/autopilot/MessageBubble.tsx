import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Check, Copy, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { ActionBlock } from '@/components/autopilot/ActionBlock'
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
        <div className="max-w-[80%] rounded-2xl rounded-br-sm border border-purple-500/30 bg-purple-600/80 px-4 py-3 text-white shadow-glass-purple backdrop-blur-sm">
          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
          <p className="mt-1 text-right text-[11px] text-purple-200">{formatTime(message.created_at)}</p>
        </div>
      </div>
    )
  }

  // Divide o conteúdo nos marcadores {{ACTION:N}} para renderizar cada
  // ActionBlock exatamente onde a IA posicionou a ação no texto.
  const segments = message.content.split(ACTION_MARKER_REGEX)

  return (
    <div className="group flex animate-float-up justify-start gap-3">
      <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-purple-500/30 bg-purple-500/20 p-1.5 text-purple-300">
        <Sparkles className="h-3.5 w-3.5" />
      </span>

      <div className="max-w-[85%] flex-1">
        <div className="rounded-2xl rounded-bl-sm border border-white/[0.10] bg-white/[0.06] px-4 py-3 text-white shadow-[0_12px_40px_rgba(11,0,20,0.32)] backdrop-blur-xl">
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
              <div key={`text-${index}`} className="autopilot-markdown text-sm">
                <ReactMarkdown>{segment}</ReactMarkdown>
              </div>
            )
          })}
        </div>

        <div className="mt-1 flex items-center gap-3 px-1">
          <span className="text-[11px] text-[var(--text-muted)]">{formatTime(message.created_at)}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] p-1.5 opacity-0 transition-all duration-150 hover:bg-[var(--bg-card-hover)] group-hover:opacity-100"
            aria-label="Copiar mensagem"
          >
            {copied ? (
              <Check className="h-3 w-3 text-emerald-500" />
            ) : (
              <Copy className="h-3 w-3 text-[var(--text-secondary)]" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
