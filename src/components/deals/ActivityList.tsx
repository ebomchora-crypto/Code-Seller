import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { HistoryTimeline } from '@/components/ui/HistoryTimeline'
import { StageBadge } from '@/components/deals/StageBadge'
import { DEAL_ACTIVITY_META } from '@/components/deals/activityMeta'
import type { DealActivity, DealStage } from '@/types'

interface ActivityListProps {
  activities: DealActivity[]
  onDelete: (id: string) => Promise<void>
}

function isStageChangeMetadata(metadata: unknown): metadata is { from: DealStage; to: DealStage } {
  return typeof metadata === 'object' && metadata !== null && 'from' in metadata && 'to' in metadata
}

export function ActivityList({ activities, onDelete }: ActivityListProps) {
  const [pendingDelete, setPendingDelete] = useState<DealActivity | null>(null)
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
        emptyTitle="Nenhuma atividade registrada"
        emptyDescription="Registre ligações, mensagens e reuniões acima para manter o histórico deste negócio."
        items={activities.map((activity) => {
          const stageMeta = isStageChangeMetadata(activity.metadata) ? activity.metadata : null
          return {
            id: activity.id,
            meta: DEAL_ACTIVITY_META[activity.type],
            occurred_at: activity.occurred_at,
            body: stageMeta ? (
              <span className="flex flex-wrap items-center gap-2">
                <StageBadge stage={stageMeta.from} />
                <ArrowRight className="size-4 text-[var(--text-muted)]" />
                <StageBadge stage={stageMeta.to} />
              </span>
            ) : (
              activity.content
            ),
            onDelete: activity.type === 'stage_change' ? undefined : () => setPendingDelete(activity),
          }
        })}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Remover atividade"
        message="Tem certeza que deseja remover este registro do histórico? Essa ação não pode ser desfeita."
        confirmLabel="Remover"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  )
}
