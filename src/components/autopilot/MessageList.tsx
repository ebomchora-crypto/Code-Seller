import { useEffect, useRef } from 'react'
import { MessageBubble } from '@/components/autopilot/MessageBubble'
import { TypingIndicator } from '@/components/autopilot/TypingIndicator'
import { Button } from '@/components/ui/Button'
import type { AutoPilotMessage, Contact } from '@/types'

interface MessageListProps {
  contact?: Contact
  onContextChanged?: () => void
  messages: AutoPilotMessage[]
  sending: boolean
  hasOlder: boolean
  retryAvailable: boolean
  onLoadOlder: () => void
  onRetry: () => void
  onCancel: () => void
  onConfirmAction: (messageId: string, actionIndex: number) => void
  onRejectAction: (messageId: string, actionIndex: number) => void
  onRequestVariation: (instruction: string, responseContent: string) => void
}

function dateSeparatorLabel(value: string): string {
  const date = new Date(value)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

  if (isSameDay(date, today)) return 'Hoje'
  if (isSameDay(date, yesterday)) return 'Ontem'
  return date.toLocaleDateString('pt-BR')
}

export function MessageList({ messages, sending, hasOlder, retryAvailable, onLoadOlder, onRetry, onCancel,
  onConfirmAction, onRejectAction, onRequestVariation, contact, onContextChanged }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, sending])

  const itemsWithSeparators = messages.reduce<{ message: AutoPilotMessage; label: string; showSeparator: boolean }[]>(
    (acc, message) => {
      const label = dateSeparatorLabel(message.created_at)
      const previousLabel = acc[acc.length - 1]?.label
      acc.push({ message, label, showSeparator: label !== previousLabel })
      return acc
    },
    [],
  )

  return (
    <div data-lenis-prevent className="flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-8">
        {hasOlder && <Button variant="secondary" className="self-center" onClick={onLoadOlder}>Carregar mensagens anteriores</Button>}
        {messages.length === 0 && !sending && <p className="py-8 text-center text-sm text-[var(--text-muted)]">Ainda não há mensagens. Pergunte sobre este lead para começar.</p>}
        {itemsWithSeparators.map(({ message, label, showSeparator }) => {
          return (
            <div key={message.id} className="flex flex-col gap-6">
              {showSeparator && (
                <div className="flex items-center gap-3">
                  <span className="h-px flex-1 bg-[var(--border-subtle)]" />
                  <span className="rounded-full border border-[var(--border-subtle)] px-2.5 py-0.5 text-[11.5px] text-[var(--text-muted)]">
                    {label}
                  </span>
                  <span className="h-px flex-1 bg-[var(--border-subtle)]" />
                </div>
              )}
              <MessageBubble
                contact={contact}
                onContextChanged={onContextChanged}
                message={message}
                onConfirmAction={(actionIndex) => onConfirmAction(message.id, actionIndex)}
                onRejectAction={(actionIndex) => onRejectAction(message.id, actionIndex)}
                onRequestVariation={(instruction, response) => onRequestVariation(instruction, response)}
                sending={sending}
              />
            </div>
          )
        })}

        {sending && <TypingIndicator onCancel={onCancel} />}
        {retryAvailable && !sending && <Button variant="secondary" className="self-start" onClick={onRetry}>Tentar resposta novamente</Button>}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
