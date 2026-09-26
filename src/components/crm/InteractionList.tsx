import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { INTERACTION_META } from '@/components/crm/interactionMeta'
import { formatRelativeDate } from '@/utils/date'
import { INTERACTION_TYPE_LABELS, type Interaction } from '@/types'

interface InteractionListProps {
  interactions: Interaction[]
  onDelete: (id: string) => Promise<void>
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function InteractionList({ interactions, onDelete }: InteractionListProps) {
  const [pendingDelete, setPendingDelete] = useState<Interaction | null>(null)
  const [deleting, setDeleting] = useState(false)

  if (interactions.length === 0) {
    return (
      <div className="rounded-[18px] border border-dashed border-[var(--border-default)] px-6 py-12 text-center">
        <p className="text-[14px] font-medium text-[var(--text-primary)]">Nenhuma interação registrada</p>
        <p className="mx-auto mt-1 max-w-sm text-[13px] text-[var(--text-muted)]">
          Registre ligações, mensagens e reuniões acima para manter o histórico deste contato.
        </p>
      </div>
    )
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    await onDelete(pendingDelete.id)
    setDeleting(false)
    setPendingDelete(null)
  }

  return (
    <>
      <ol className="relative before:absolute before:bottom-5 before:left-[17.5px] before:top-5 before:w-px before:bg-[var(--border-default)]">
        {interactions.map((interaction) => {
          const { icon: Icon, color } = INTERACTION_META[interaction.type]
          return (
            <li key={interaction.id} className="group relative pb-5 pl-14 last:pb-0">
              <span
                className="absolute left-0 top-0 z-10 flex size-9 items-center justify-center rounded-xl border bg-[var(--bg-card)]"
                style={{ color, borderColor: `${color}55` }}
              >
                <Icon className="size-4" />
              </span>
              <div className="flex items-center justify-between gap-3">
                <p className="flex flex-wrap items-center gap-x-2 text-[12.5px]">
                  <span className="font-semibold" style={{ color }}>
                    {INTERACTION_TYPE_LABELS[interaction.type]}
                  </span>
                  <time dateTime={interaction.occurred_at} title={formatDateTime(interaction.occurred_at)} className="text-[var(--text-muted)]">
                    {formatRelativeDate(interaction.occurred_at)}
                  </time>
                </p>
                <button
                  type="button"
                  onClick={() => setPendingDelete(interaction)}
                  aria-label="Remover interação"
                  title="Remover"
                  className="flex size-7 items-center justify-center rounded-lg text-[var(--text-muted)] opacity-0 transition hover:bg-red-500/10 hover:text-red-500 focus:opacity-100 group-hover:opacity-100"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
              <p className="mt-1.5 whitespace-pre-line rounded-2xl rounded-tl-md border border-[var(--border-subtle)] bg-black/[0.015] px-4 py-3 text-[14px] leading-relaxed text-[var(--text-primary)] dark:bg-white/[0.025]">
                {interaction.content}
              </p>
            </li>
          )
        })}
      </ol>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Remover interação"
        message="Tem certeza que deseja remover este registro do histórico? Essa ação não pode ser desfeita."
        confirmLabel="Remover"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  )
}
