import { useState } from 'react'
import { FloatingPathsBackground } from '@/components/ui/floating-paths'
import { ConversationSidebar } from '@/components/autopilot/ConversationSidebar'
import { ChatInterface } from '@/components/autopilot/ChatInterface'
import { useAutoPilot } from '@/hooks/useAutoPilot'

export default function AutopilotPage() {
  const {
    conversations,
    activeConversation,
    messages,
    context,
    loading,
    sending,
    selectConversation,
    createNewConversation,
    deleteConversation,
    renameConversation,
    sendMessage,
    confirmAction,
    rejectAction,
    refreshContext,
  } = useAutoPilot()

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <FloatingPathsBackground
        position={-1}
        pathOpacity={0.25}
        pathCount={10}
        className="autopilot-theme h-[calc(100vh-4rem)] min-h-[640px] bg-accent-ink"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-48 left-1/2 h-[520px] w-[760px] -translate-x-1/2 rounded-full bg-accent-bright/[0.12] blur-[140px]"
        />
        <div className="flex h-full">
          <div
            className={`fixed inset-y-0 left-0 z-30 w-72 transform transition-transform duration-200 lg:static lg:z-auto lg:w-72 lg:translate-x-0 ${
              mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <ConversationSidebar
              conversations={conversations}
              activeConversationId={activeConversation?.id ?? null}
              loading={loading}
              onSelect={(id) => {
                void selectConversation(id)
                setMobileSidebarOpen(false)
              }}
              onCreate={() => {
                void createNewConversation()
                setMobileSidebarOpen(false)
              }}
              onDelete={(id) => void deleteConversation(id)}
            />
          </div>

          {mobileSidebarOpen && (
            <button
              type="button"
              aria-label="Fechar menu de conversas"
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 z-20 bg-accent-ink/70 backdrop-blur-sm lg:hidden"
            />
          )}

          <ChatInterface
            conversation={activeConversation}
            messages={messages}
            context={context}
            sending={sending}
            onSendMessage={(content) => void sendMessage(content)}
            onConfirmAction={(messageId, actionIndex) => void confirmAction(messageId, actionIndex)}
            onRejectAction={(messageId, actionIndex) => void rejectAction(messageId, actionIndex)}
            onRefreshContext={refreshContext}
            onRenameConversation={(title) => {
              if (activeConversation) void renameConversation(activeConversation.id, title)
            }}
            onOpenSidebar={() => setMobileSidebarOpen(true)}
          />
        </div>
    </FloatingPathsBackground>
  )
}
