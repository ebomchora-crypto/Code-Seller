import { useState } from 'react'
import { Menu } from 'lucide-react'
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
    <div className="relative flex h-full flex-1 flex-col">
      <div className="relative z-10 flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-4 py-4 sm:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenSidebar}
            aria-label="Abrir conversas"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-muted)] lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
          {editingTitle ? (
            <input
              autoFocus
              value={titleValue}
              onChange={(event) => setTitleValue(event.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()}
              className="min-w-0 flex-1 border-b border-purple-500/50 bg-transparent text-base font-medium text-[var(--text-primary)] outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setTitleValue(conversation?.title ?? 'Nova conversa')
                if (conversation) setEditingTitle(true)
              }}
              className="truncate font-display text-base font-semibold text-white hover:text-accent-bright"
            >
              {conversation?.title ?? 'Nova conversa'}
            </button>
          )}
        </div>

        <ContextBadge context={context} onRefresh={handleRefresh} refreshing={refreshing} />
      </div>

      {messages.length === 0 ? (
        <div className="relative z-10 flex flex-1 flex-col justify-center overflow-y-auto">
          <QuickPrompts onSelect={onSendMessage} sending={sending} hasContext={context !== null} />
        </div>
      ) : (
        <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
          <MessageList
            messages={messages}
            sending={sending}
            onConfirmAction={onConfirmAction}
            onRejectAction={onRejectAction}
          />
        </div>
      )}

      {messages.length > 0 && (
        <div className="relative z-10">
          <MessageInput onSend={onSendMessage} sending={sending} hasContext={context !== null} />
        </div>
      )}
    </div>
  )
}
