import { useState } from 'react'
import { MessageSquare, Plus, Trash2 } from 'lucide-react'
import { CopilotOrb } from '@/components/autopilot/CopilotOrb'
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
    <div className="relative flex h-full w-full flex-col border-r border-[var(--border-subtle)] bg-[var(--panel-bg)] lg:bg-black/[0.015] lg:dark:bg-white/[0.015]">
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-[var(--border-subtle)] px-4">
        <CopilotOrb size="sm" />
        <span className="min-w-0">
          <span className="block font-display text-[14.5px] font-semibold leading-tight text-[var(--text-primary)]">CS Copilot</span>
          <span className="block text-[11.5px] leading-tight text-[var(--text-muted)]">Seu assistente de vendas</span>
        </span>
      </div>

      <div className="p-3">
        <button
          type="button"
          onClick={onCreate}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#8b5cf6,#6d28d9)] text-[13.5px] font-medium text-white shadow-[0_8px_22px_-10px_rgba(124,58,237,0.9)] transition hover:brightness-110"
        >
          <Plus className="size-4" strokeWidth={2.4} />
          Nova conversa
        </button>
      </div>

      <p className="px-5 pb-1.5 pt-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Conversas</p>

      <div data-lenis-prevent className="scrollbar-none flex-1 overflow-y-auto px-2 pb-3">
        {loading ? (
          <div className="flex flex-col gap-2 px-2">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ) : conversations.length === 0 ? (
          <p className="px-3 py-3 text-[13px] leading-relaxed text-[var(--text-muted)]">
            Nenhuma conversa ainda. Faça sua primeira pergunta ao lado.
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {conversations.map((conversation) => {
              const active = conversation.id === activeConversationId
              return (
                <li key={conversation.id}>
                  <div
                    className={`group relative flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-colors duration-150 ${
                      active
                        ? 'border-[var(--nav-active-border)] shadow-[var(--nav-active-shadow)]'
                        : 'border-transparent hover:bg-[var(--sidebar-item-hover)]'
                    }`}
                    style={active ? { background: 'var(--nav-active-bg)' } : undefined}
                  >
                    <MessageSquare
                      className={`size-4 shrink-0 ${active ? 'text-[var(--accent-text)]' : 'text-[var(--text-muted)]'}`}
                    />
                    <button type="button" onClick={() => onSelect(conversation.id)} className="min-w-0 flex-1 text-left">
                      <span
                        className={`block truncate text-[13.5px] ${
                          active ? 'font-semibold text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                        }`}
                      >
                        {conversation.title}
                      </span>
                      <span className="block text-[11.5px] text-[var(--text-muted)]">
                        {formatRelativeDate(conversation.updated_at)}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingId(conversation.id)}
                      aria-label="Excluir conversa"
                      title="Excluir conversa"
                      className="flex size-7 items-center justify-center rounded-lg text-[var(--text-muted)] opacity-0 transition hover:bg-red-500/10 hover:text-red-500 focus:opacity-100 group-hover:opacity-100"
                    >
                      <Trash2 className="size-3.5" />
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
