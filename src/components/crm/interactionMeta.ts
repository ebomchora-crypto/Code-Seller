import { FileText, Mail, MessageCircle, MoreHorizontal, Phone, StickyNote, Users } from 'lucide-react'
import type { HistoryTypeMeta } from '@/components/ui/HistoryComposer'
import { INTERACTION_TYPE_LABELS, type InteractionType } from '@/types'

// Ícone e cor de cada tipo de interação — compositor e linha do tempo.
export const INTERACTION_META: Record<InteractionType, HistoryTypeMeta> = {
  note: { label: INTERACTION_TYPE_LABELS.note, icon: StickyNote, color: '#a78bfa' },
  call: { label: INTERACTION_TYPE_LABELS.call, icon: Phone, color: '#60a5fa' },
  email: { label: INTERACTION_TYPE_LABELS.email, icon: Mail, color: '#f472b6' },
  whatsapp: { label: INTERACTION_TYPE_LABELS.whatsapp, icon: MessageCircle, color: '#34d399' },
  meeting: { label: INTERACTION_TYPE_LABELS.meeting, icon: Users, color: '#fbbf24' },
  proposal: { label: INTERACTION_TYPE_LABELS.proposal, icon: FileText, color: '#818cf8' },
  other: { label: INTERACTION_TYPE_LABELS.other, icon: MoreHorizontal, color: '#9ca3af' },
}
