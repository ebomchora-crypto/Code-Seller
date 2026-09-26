import { FileText, Mail, MessageCircle, MoreHorizontal, Phone, StickyNote, Users, type LucideIcon } from 'lucide-react'
import type { InteractionType } from '@/types'

// Ícone e cor de cada tipo de interação — compositor e linha do tempo.
export const INTERACTION_META: Record<InteractionType, { icon: LucideIcon; color: string }> = {
  note: { icon: StickyNote, color: '#a78bfa' },
  call: { icon: Phone, color: '#60a5fa' },
  email: { icon: Mail, color: '#f472b6' },
  whatsapp: { icon: MessageCircle, color: '#34d399' },
  meeting: { icon: Users, color: '#fbbf24' },
  proposal: { icon: FileText, color: '#818cf8' },
  other: { icon: MoreHorizontal, color: '#9ca3af' },
}
