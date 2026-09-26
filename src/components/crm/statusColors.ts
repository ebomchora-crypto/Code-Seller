import type { ContactStatus } from '@/types'

// Cor de cada status de contato — usada nos chips de filtro e no kanban.
export const CONTACT_STATUS_COLORS: Record<ContactStatus, string> = {
  lead: '#a78bfa',
  negotiating: '#f59e0b',
  client: '#10b981',
  inactive: '#71717a',
  lost: '#ef4444',
}
