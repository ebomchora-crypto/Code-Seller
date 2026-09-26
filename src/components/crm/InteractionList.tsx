import { useState } from 'react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { HistoryTimeline } from '@/components/ui/HistoryTimeline'
import { INTERACTION_META } from '@/components/crm/interactionMeta'
import type { Interaction } from '@/types'

interface InteractionListProps {
  interactions: Interaction[]
  onDelete: (id: string) => Promise<void>
}

export function InteractionList({ interactions, onDelete }: InteractionListProps) {
  const [pendingDelete, setPendingDelete] = useState<Interaction | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleConfirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    await onDelete(pendingDelete.id)
    setDeleting(false)
    setPendingDelete(null)
  }

  return (
    <>
      <HistoryTimeline
        emptyTitle="Nenhuma interação registrada"
        emptyDescription="Registre ligações, mensagens e reuniões acima para manter o histórico deste contato."
        items={interactions.map((interaction) => ({
          id: interaction.id,
          meta: INTERACTION_META[interaction.type],
          occurred_at: interaction.occurred_at,
          body: interaction.content,
          onDelete: () => setPendingDelete(interaction),
        }))}
      />

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
