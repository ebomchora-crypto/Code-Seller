import { useState } from 'react'
import { Sparkles, Trash2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatRelativeDate } from '@/utils/date'
import type { AutoPilotConversation } from '@/types'

interface ConversationSidebarProps {
  conversations: AutoPilotConversation[]
  activeConversationId: string | null
  loading: boolean
  onSelect: (id: string) => void
  onCreate: () => void
  onDelete: (id: string) => void
}

export function ConversationSidebar({
  conversations,
  activeConversationId,
  loading,
  onSelect,
  onCreate,
  onDelete,
}: ConversationSidebarProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  return (
    <div className="relative flex h-full w-full flex-col border-r border-white/[0.10] bg-white/[0.03] backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-4">
        <span className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
          <Sparkles className="h-4 w-4 text-purple-400" />
          AutoPilot
        </span>
      </div>

      <div className="p-3">
        <button
          type="button"
          onClick={onCreate}
          className="w-full rounded-xl border border-purple-500/20 bg-purple-500/10 py-2 text-sm font-medium text-purple-300 transition-colors duration-150 hover:bg-purple-500/20"
        >
          + Nova conversa
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {loading ? (
          <div className="flex flex-col gap-2 px-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : conversations.length === 0 ? (
          <p className="px-3 py-4 text-sm text-[var(--text-muted)]">Nenhuma conversa ainda.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {conversations.map((conversation) => {
              const active = conversation.id === activeConversationId
              return (
                <li key={conversation.id}>
                  <div
                    className={`group flex items-center gap-2 rounded-xl px-3 py-2 transition-all duration-150 ${
                      active
                        ? 'border border-[var(--border-default)] bg-[var(--bg-muted)] text-[var(--text-primary)]'
                        : 'border border-transparent text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <button type="button" onClick={() => onSelect(conversation.id)} className="min-w-0 flex-1 text-left">
                      <p className={`truncate text-sm ${active ? 'font-medium text-[var(--text-primary)]' : ''}`}>
                        {conversation.title}
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)]">{formatRelativeDate(conversation.updated_at)}</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingId(conversation.id)}
                      aria-label="Excluir conversa"
                      className="opacity-0 text-[var(--text-muted)] transition-opacity duration-150 hover:text-red-400 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={deletingId !== null}
        title="Excluir conversa"
        message="Tem certeza que deseja excluir esta conversa? Todas as mensagens serão perdidas."
        confirmLabel="Excluir"
        onConfirm={() => {
          if (deletingId) onDelete(deletingId)
          setDeletingId(null)
        }}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  )
}
