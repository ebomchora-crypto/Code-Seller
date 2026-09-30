import type { LeadAnalysis } from '@/types'

export type CommercialResponseSection = 'situation' | 'reading' | 'action' | 'reason' | 'message' | 'strategy' | 'next_step'

const SECTIONS: Record<LeadAnalysis['mode'], CommercialResponseSection[]> = {
  quick_reply: ['message', 'strategy'],
  analysis: ['situation', 'reading', 'action', 'reason', 'message', 'next_step'],
  objection: ['reading', 'action', 'message', 'next_step'],
  follow_up: ['situation', 'action', 'message', 'next_step'],
}

export function commercialResponseSections(analysis: LeadAnalysis): CommercialResponseSection[] {
  return SECTIONS[analysis.mode].filter((section) => {
    if (section === 'message') return Boolean(analysis.suggested_message.trim())
    if (section === 'strategy') return Boolean(analysis.strategy.trim())
    if (section === 'situation') return Boolean(analysis.summary.trim())
    if (section === 'action') return Boolean(analysis.next_action.trim())
    if (section === 'reason') return Boolean(analysis.reason.trim())
    if (section === 'next_step') return Boolean(analysis.next_step.trim())
    return Boolean(analysis.stage.trim() || analysis.evidence.trim() || analysis.objection.trim() || analysis.risk.trim())
  })
}
