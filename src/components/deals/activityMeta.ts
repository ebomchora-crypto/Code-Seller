import { FileText, Mail, MessageCircle, MoreHorizontal, Phone, Repeat, StickyNote, Users } from 'lucide-react'
import type { HistoryTypeMeta } from '@/components/ui/HistoryComposer'
import { DEAL_ACTIVITY_TYPE_LABELS, type DealActivityType } from '@/types'

// Ícone e cor de cada tipo de atividade de negócio.
export const DEAL_ACTIVITY_META: Record<DealActivityType, HistoryTypeMeta> = {
  note: { label: DEAL_ACTIVITY_TYPE_LABELS.note, icon: StickyNote, color: '#a78bfa' },
  call: { label: DEAL_ACTIVITY_TYPE_LABELS.call, icon: Phone, color: '#60a5fa' },
  email: { label: DEAL_ACTIVITY_TYPE_LABELS.email, icon: Mail, color: '#f472b6' },
  whatsapp: { label: DEAL_ACTIVITY_TYPE_LABELS.whatsapp, icon: MessageCircle, color: '#34d399' },
  meeting: { label: DEAL_ACTIVITY_TYPE_LABELS.meeting, icon: Users, color: '#fbbf24' },
  stage_change: { label: DEAL_ACTIVITY_TYPE_LABELS.stage_change, icon: Repeat, color: '#c084fc' },
  proposal_sent: { label: DEAL_ACTIVITY_TYPE_LABELS.proposal_sent, icon: FileText, color: '#818cf8' },
  other: { label: DEAL_ACTIVITY_TYPE_LABELS.other, icon: MoreHorizontal, color: '#9ca3af' },
}
