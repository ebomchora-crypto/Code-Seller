import { useState } from 'react'
import { ConversationSidebar } from '@/components/autopilot/ConversationSidebar'
import { ChatInterface } from '@/components/autopilot/ChatInterface'
import { useAutoPilot } from '@/hooks/useAutoPilot'

export default function CopilotPage() {
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
    <div className="relative flex h-full overflow-hidden">
      {/* Brilho roxo atrás do chat, igual ao topo das outras telas. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-56 left-1/2 h-[460px] w-[760px] -translate-x-1/3 rounded-full bg-[#7c3aed]/[0.08] blur-[130px]"
      />

      <div
        className={`absolute inset-y-0 left-0 z-30 w-[280px] transition-transform duration-300 lg:static lg:translate-x-0 ${
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
          aria-label="Fechar lista de conversas"
          onClick={() => setMobileSidebarOpen(false)}
          className="absolute inset-0 z-20 bg-[#08060d]/50 backdrop-blur-sm lg:hidden"
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
  )
}
