import { useState } from 'react'
import { Menu, Pencil } from 'lucide-react'
import { ContextBadge } from '@/components/autopilot/ContextBadge'
import { MessageList } from '@/components/autopilot/MessageList'
import { MessageInput } from '@/components/autopilot/MessageInput'
import { QuickPrompts } from '@/components/autopilot/QuickPrompts'
import type { AutoPilotContext, AutoPilotConversation, AutoPilotMessage } from '@/types'

interface ChatInterfaceProps {
  conversation: AutoPilotConversation | null
  messages: AutoPilotMessage[]
  context: AutoPilotContext | null
  sending: boolean
  onSendMessage: (content: string) => void
  onConfirmAction: (messageId: string, actionIndex: number) => void
  onRejectAction: (messageId: string, actionIndex: number) => void
  onRefreshContext: () => void
  onRenameConversation: (title: string) => void
  onOpenSidebar: () => void
}

export function ChatInterface({
  conversation,
  messages,
  context,
  sending,
  onSendMessage,
  onConfirmAction,
  onRejectAction,
  onRefreshContext,
  onRenameConversation,
  onOpenSidebar,
}: ChatInterfaceProps) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(conversation?.title ?? 'Nova conversa')
  const [refreshing, setRefreshing] = useState(false)

  function handleTitleBlur() {
    setEditingTitle(false)
    const trimmed = titleValue.trim()
    if (!conversation || !trimmed || trimmed === conversation.title) {
      setTitleValue(conversation?.title ?? 'Nova conversa')
      return
    }
    onRenameConversation(trimmed)
  }

  async function handleRefresh() {
    setRefreshing(true)
    await onRefreshContext()
    setRefreshing(false)
  }

  return (
    <div className="relative flex h-full min-w-0 flex-1 flex-col">
      <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={onOpenSidebar}
            aria-label="Abrir conversas"
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[var(--border-default)] text-[var(--text-muted)] lg:hidden"
          >
            <Menu className="size-4" />
          </button>
          {editingTitle ? (
            <input
              autoFocus
              value={titleValue}
              onChange={(event) => setTitleValue(event.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()}
              aria-label="Nome da conversa"
              className="min-w-0 flex-1 rounded-lg border border-[var(--accent-ring)] bg-[var(--field-bg)] px-2.5 py-1 text-[14.5px] font-semibold text-[var(--text-primary)] outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setTitleValue(conversation?.title ?? 'Nova conversa')
                if (conversation) setEditingTitle(true)
              }}
              title={conversation ? 'Renomear conversa' : undefined}
              className="group flex min-w-0 items-center gap-2 rounded-lg px-2 py-1 text-left transition-colors hover:bg-[var(--bg-muted)]"
            >
              <span className="truncate font-display text-[15px] font-semibold text-[var(--text-primary)]">
                {conversation?.title ?? 'Nova conversa'}
              </span>
              {conversation && <Pencil className="size-3.5 shrink-0 text-[var(--text-muted)] opacity-0 transition group-hover:opacity-100" />}
            </button>
          )}
        </div>

        <ContextBadge context={context} onRefresh={handleRefresh} refreshing={refreshing} />
      </div>

      {messages.length === 0 ? (
        <div data-lenis-prevent className="flex flex-1 flex-col overflow-y-auto">
          <QuickPrompts onSelect={onSendMessage} sending={sending} hasContext={context !== null} context={context} />
        </div>
      ) : (
        <>
          <div className="flex min-h-0 flex-1 flex-col">
            <MessageList
              messages={messages}
              sending={sending}
              onConfirmAction={onConfirmAction}
              onRejectAction={onRejectAction}
            />
          </div>
          <MessageInput onSend={onSendMessage} sending={sending} hasContext={context !== null} />
        </>
      )}
    </div>
  )
}
