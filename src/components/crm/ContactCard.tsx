import { Link } from 'react-router-dom'
import { TagBadge } from '@/components/crm/TagBadge'
import type { Contact } from '@/types'

interface ContactCardProps {
  contact: Contact
  dragHandleProps?: Record<string, unknown>
  isDragging?: boolean
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('pt-BR')
}

export function ContactCard({ contact, dragHandleProps, isDragging = false }: ContactCardProps) {
  const location = [contact.city, contact.state].filter(Boolean).join(' / ')

  return (
    <Link
      to={`/crm/${contact.id}`}
      {...dragHandleProps}
      aria-label={`Abrir detalhes de ${contact.name}`}
      className={`block rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 transition-all duration-200 hover:border-accent-bright/40 hover:shadow-[var(--shadow-card)] ${
        isDragging ? 'rotate-2 shadow-[0_16px_50px_rgba(179,92,255,0.20)]' : 'shadow-[var(--shadow-card)]'
      }`}
    >
      <p className="truncate text-sm font-medium text-[var(--text-primary)]">{contact.name}</p>
      {contact.niche && <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{contact.niche}</p>}
      {location && <p className="mt-0.5 text-xs text-[var(--text-muted)]">{location}</p>}
      {contact.phone && <p className="mt-0.5 text-xs text-[var(--text-muted)]">{contact.phone}</p>}

      {contact.tags && contact.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {contact.tags.map((tag) => (
            <TagBadge key={tag.id} tag={tag} />
          ))}
        </div>
      )}

      <p className="mt-3 text-[11px] text-[var(--text-muted)]">{formatDate(contact.created_at)}</p>
    </Link>
  )
}
