import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/crm/StatusBadge'
import { InitialsAvatar, PanelHeader, PanelLink } from '@/components/dashboard/PanelHeader'
import { formatRelativeDate } from '@/utils/date'
import type { Contact } from '@/types'
import { fadeInUp, staggerContainer } from '@/utils/animations'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface RecentContactsListProps {
  contacts: Contact[]
  loading: boolean
  error?: string | null
  onRetry?: () => void
  onCreateContact: () => void
}

export function RecentContactsList({ contacts, loading, error, onRetry, onCreateContact }: RecentContactsListProps) {
  const reducedMotion = useReducedMotion()
  return (
    <Card className="h-full">
      <PanelHeader title="Contatos recentes" subtitle="Quem entrou no seu CRM" action={<PanelLink to="/crm">Ver todos</PanelLink>} />

      {loading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <Skeleton className="size-10 shrink-0 rounded-xl" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : contacts.length === 0 ? (
        <EmptyState
          title="Nenhum contato adicionado ainda"
          action={<Button size="sm" onClick={onCreateContact}>Adicionar contato</Button>}
        />
      ) : (
        <motion.ul initial={reducedMotion ? false : 'hidden'} animate="visible" variants={staggerContainer(0.04)} className="-mx-2 flex flex-col gap-1">
          {contacts.map((contact, index) => (
            <motion.li key={contact.id} variants={index < 8 ? fadeInUp : undefined}>
              <Link
                to={`/crm/${contact.id}`}
                className="flex items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors duration-150 hover:bg-[var(--bg-muted)]"
              >
                <InitialsAvatar name={contact.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-[var(--text-primary)]">{contact.name}</p>
                  <p className="mt-0.5 truncate text-[12.5px] text-[var(--text-muted)]">
                    {[contact.niche, [contact.city, contact.state].filter(Boolean).join('/')].filter(Boolean).join(' · ') || '—'}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <StatusBadge status={contact.status} />
                  <span className="text-[11.5px] text-[var(--text-muted)]">{formatRelativeDate(contact.created_at)}</span>
                </div>
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </Card>
  )
}
