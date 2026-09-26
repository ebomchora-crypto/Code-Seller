import { HistoryComposer } from '@/components/ui/HistoryComposer'
import { INTERACTION_META } from '@/components/crm/interactionMeta'
import { INTERACTION_TYPE_LABELS, type Interaction, type InteractionType } from '@/types'

interface InteractionFormProps {
  onSubmit: (data: Omit<Interaction, 'id' | 'user_id' | 'created_at' | 'contact_id'>) => Promise<void>
}

const TYPES = Object.keys(INTERACTION_TYPE_LABELS) as InteractionType[]

export function InteractionForm({ onSubmit }: InteractionFormProps) {
  return (
    <HistoryComposer
      types={TYPES}
      meta={INTERACTION_META}
      placeholder="O que foi conversado ou feito nesta interação?"
      emptyError="Descreva a interação antes de registrar."
      onSubmit={onSubmit}
    />
  )
}
