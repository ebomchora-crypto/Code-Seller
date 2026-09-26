import { HistoryComposer } from '@/components/ui/HistoryComposer'
import { DEAL_ACTIVITY_META } from '@/components/deals/activityMeta'
import type { DealActivity, DealActivityType } from '@/types'

interface ActivityFormProps {
  onSubmit: (data: Omit<DealActivity, 'id' | 'user_id' | 'created_at' | 'deal_id'>) => Promise<void>
}

// stage_change é um registro automático do sistema — não aparece como opção manual.
const SELECTABLE_TYPES: DealActivityType[] = ['note', 'call', 'email', 'whatsapp', 'meeting', 'proposal_sent', 'other']

export function ActivityForm({ onSubmit }: ActivityFormProps) {
  return (
    <HistoryComposer
      types={SELECTABLE_TYPES}
      meta={DEAL_ACTIVITY_META}
      placeholder="O que foi feito ou conversado neste negócio?"
      emptyError="Descreva a atividade antes de registrar."
      onSubmit={onSubmit}
    />
  )
}
