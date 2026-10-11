import { Link } from 'react-router-dom'
import { MapPin, Phone, Repeat } from 'lucide-react'
import { useSubscriptionIndex } from '@/hooks/useSubscriptionIndex'
import { formatMoney } from '@/utils/currency'
import { TagBadge } from '@/components/crm/TagBadge'
import { InitialsAvatar } from '@/components/ui/InitialsAvatar'
import { formatRelativeDate } from '@/utils/date'
import type { Contact } from '@/types'

interface ContactCardProps {
  contact: Contact
  dragHandleProps?: Record<string, unknown>
  isDragging?: boolean
}

export function ContactCard({ contact, dragHandleProps, isDragging = false }: ContactCardProps) {
  const location = [contact.city, contact.state].filter(Boolean).join('/')
  const created = formatRelativeDate(contact.created_at)
  const subscriptions = useSubscriptionIndex().filter((item) => item.contact_id === contact.id)
  const perMonth = subscriptions.reduce<Record<string, number>>((sum, item) => ({ ...sum, [item.currency]: (sum[item.currency] ?? 0) + item.amount }), {})

  return (
    <Link
      to={`/crm/${contact.id}`}
      {...dragHandleProps}
      aria-label={`Abrir detalhes de ${contact.name}`}
      className={`block rounded-[18px] border bg-[var(--bg-card)] p-4 transition-all duration-200 hover:border-[var(--accent-ring)] ${
        isDragging
          ? 'rotate-2 border-[var(--accent-ring)] shadow-[0_24px_60px_-20px_rgba(124,58,237,0.55)]'
          : 'border-[var(--border-subtle)] shadow-[var(--shadow-card)]'
      }`}
    >
      <div className="flex items-center gap-3">
        <InitialsAvatar name={contact.name} size="sm" />
        <div className="min-w-0">
          <p className="line-clamp-2 text-[14px] font-semibold leading-snug text-[var(--text-primary)]">{contact.name}</p>
          {contact.niche && <p className="truncate text-[12px] text-[var(--text-muted)]">{contact.niche}</p>}
        </div>
      </div>

      {(location || contact.phone) && (
        <div className="mt-3 flex flex-col gap-1 text-[12.5px] text-[var(--text-secondary)]">
          {location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5 text-[var(--text-muted)]" />
              {location}
            </span>
          )}
          {contact.phone && (
            <span className="flex items-center gap-1.5 tabular-nums">
              <Phone className="size-3.5 text-[var(--text-muted)]" />
              {contact.phone}
            </span>
          )}
        </div>
      )}

      {subscriptions.length > 0 && (
        <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/12 px-2 py-0.5 text-[11.5px] font-semibold text-emerald-600 dark:text-emerald-400" title="Mensalidade ativa">
          <Repeat className="size-3" /> {Object.entries(perMonth).map(([currency, value]) => `${formatMoney(value, currency, { decimals: false })}/mês`).join(' + ')}
        </p>
      )}

      {contact.tags && contact.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {contact.tags.map((tag) => (
            <TagBadge key={tag.id} tag={tag} />
          ))}
        </div>
      )}

      <p className="mt-3 border-t border-[var(--border-subtle)] pt-2.5 text-[11.5px] text-[var(--text-muted)]">
        {/^\d/.test(created) ? `Criado em ${created}` : `Criado ${created}`}
      </p>
    </Link>
  )
}
