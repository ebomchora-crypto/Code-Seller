import type { AutoPilotContext } from '@/types'

export function leadContextForAI(lead: NonNullable<AutoPilotContext['selected_lead']>) {
  return { ...lead, proposals: lead.proposals.map((row) => ({ ...row, token: undefined })) }
}
