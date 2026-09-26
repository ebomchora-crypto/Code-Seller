import { useEffect, useRef } from 'react'
import { MessageBubble } from '@/components/autopilot/MessageBubble'
import { TypingIndicator } from '@/components/autopilot/TypingIndicator'
import type { AutoPilotMessage } from '@/types'

interface MessageListProps {
  messages: AutoPilotMessage[]
  sending: boolean
  onConfirmAction: (messageId: string, actionIndex: number) => void
  onRejectAction: (messageId: string, actionIndex: number) => void
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

export function MessageList({ messages, sending, onConfirmAction, onRejectAction }: MessageListProps) {
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
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-8">
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
                message={message}
                onConfirmAction={(actionIndex) => onConfirmAction(message.id, actionIndex)}
                onRejectAction={(actionIndex) => onRejectAction(message.id, actionIndex)}
              />
            </div>
          )
        })}

        {sending && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
