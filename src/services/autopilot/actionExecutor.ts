import { getContactById, updateContact } from '@/services/supabase/contacts'
import { getDealById, updateDealStage } from '@/services/supabase/deals'
import { createInteraction } from '@/services/supabase/interactions'
import { createTask } from '@/services/supabase/tasks'
import { CONTACT_STATUSES } from '@/types'
import type { ContactStatus, DealStage, InteractionType, ProposedAction, TaskPriority } from '@/types'

const DEAL_STAGE_VALUES: DealStage[] = ['contact', 'qualified', 'proposal', 'negotiation', 'closing', 'won', 'lost']
const TASK_PRIORITY_VALUES: TaskPriority[] = ['low', 'medium', 'high', 'urgent']
const INTERACTION_TYPE_VALUES: InteractionType[] = ['note', 'call', 'email', 'whatsapp', 'meeting', 'proposal', 'other']

function requireString(payload: Record<string, unknown>, key: string): string {
  const value = payload[key]
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Ação inválida: campo "${key}" ausente ou inválido.`)
  }
  return value
}

function optionalString(payload: Record<string, unknown>, key: string): string | null {
  const value = payload[key]
  return typeof value === 'string' && value.trim() ? value : null
}

async function executeCreateTask(payload: Record<string, unknown>): Promise<void> {
  const title = requireString(payload, 'title')
  const priorityRaw = payload.priority
  const priority: TaskPriority = TASK_PRIORITY_VALUES.includes(priorityRaw as TaskPriority)
    ? (priorityRaw as TaskPriority)
    : 'medium'
  const dueDate = optionalString(payload, 'due_date')
  const contactId = optionalString(payload, 'contact_id')
  const dealId = optionalString(payload, 'deal_id')

  if (contactId && !(await getContactById(contactId))) {
    throw new Error('O contato referenciado por esta ação não existe mais.')
  }
  if (dealId && !(await getDealById(dealId))) {
    throw new Error('O negócio referenciado por esta ação não existe mais.')
  }

  await createTask({
    title,
    description: null,
    status: 'todo',
    priority,
    due_date: dueDate,
    reminder_at: null,
    contact_id: contactId,
    deal_id: dealId,
    assigned_to: null,
    recurrence: 'none',
    recurrence_end_date: null,
    parent_task_id: null,
    position: 0,
    completed_at: null,
  })
}

async function executeUpdateDealStage(payload: Record<string, unknown>): Promise<void> {
  const dealId = requireString(payload, 'deal_id')
  const stageRaw = payload.stage

  if (!DEAL_STAGE_VALUES.includes(stageRaw as DealStage)) {
    throw new Error('Ação inválida: etapa de negócio desconhecida.')
  }

  const deal = await getDealById(dealId)
  if (!deal) {
    throw new Error('O negócio referenciado por esta ação não existe mais.')
  }

  const previousStageRaw = payload.previous_stage
  const previousStage = DEAL_STAGE_VALUES.includes(previousStageRaw as DealStage)
    ? (previousStageRaw as DealStage)
    : deal.stage

  await updateDealStage(dealId, stageRaw as DealStage, previousStage)
}

async function executeCreateInteraction(payload: Record<string, unknown>): Promise<void> {
  const contactId = requireString(payload, 'contact_id')
  const typeRaw = payload.type
  const content = requireString(payload, 'content')
  const occurredAt = optionalString(payload, 'occurred_at') ?? new Date().toISOString()

  if (!INTERACTION_TYPE_VALUES.includes(typeRaw as InteractionType)) {
    throw new Error('Ação inválida: tipo de interação desconhecido.')
  }
  if (!(await getContactById(contactId))) {
    throw new Error('O contato referenciado por esta ação não existe mais.')
  }

  await createInteraction({
    contact_id: contactId,
    type: typeRaw as InteractionType,
    content,
    occurred_at: occurredAt,
  })
}

async function executeUpdateContactStatus(payload: Record<string, unknown>): Promise<void> {
  const contactId = requireString(payload, 'contact_id')
  const statusRaw = payload.status

  if (!(CONTACT_STATUSES as string[]).includes(statusRaw as ContactStatus)) {
    throw new Error('Ação inválida: status de contato desconhecido.')
  }
  if (!(await getContactById(contactId))) {
    throw new Error('O contato referenciado por esta ação não existe mais.')
  }

  await updateContact(contactId, { status: statusRaw as ContactStatus })
}

// Executa uma ação já confirmada pelo usuário. Cada branch valida o payload
// e a existência dos registros referenciados antes de escrever no banco —
// uma ação com payload inválido nunca é executada silenciosamente, ela lança
// um erro claro que o hook chamador transforma em status "failed" + toast.
export async function executeAction(action: ProposedAction): Promise<void> {
  switch (action.type) {
    case 'create_task':
      return executeCreateTask(action.payload)
    case 'update_deal_stage':
      return executeUpdateDealStage(action.payload)
    case 'create_interaction':
      return executeCreateInteraction(action.payload)
    case 'update_contact_status':
      return executeUpdateContactStatus(action.payload)
    default: {
      const exhaustiveCheck: never = action.type
      throw new Error(`Tipo de ação desconhecido: ${exhaustiveCheck}`)
    }
  }
}
