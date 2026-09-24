import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/crm/StatusBadge'
import { formatRelativeDate } from '@/utils/date'
import type { Contact } from '@/types'
import { motion } from 'motion/react'
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
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">Contatos Recentes</h3>
        <Link to="/crm" className="text-sm text-purple-500 transition-colors hover:text-purple-600">
          Ver todos →
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
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
        <motion.ul initial={reducedMotion ? false : 'hidden'} animate="visible" variants={staggerContainer(0.04)} className="divide-y divide-[var(--border-subtle)]">
          {contacts.map((contact, index) => (
            <motion.li key={contact.id} variants={index < 8 ? fadeInUp : undefined}>
              <Link
                to={`/crm/${contact.id}`}
                className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 transition-colors duration-150 hover:bg-accent-soft/40 dark:hover:bg-accent-bright/10"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--purple-soft)] text-xs font-bold text-purple-500">
                  {contact.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--text-primary)]">{contact.name}</p>
                  <p className="truncate text-xs text-[var(--text-muted)]">
                    {[contact.niche, [contact.city, contact.state].filter(Boolean).join('/')]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <StatusBadge status={contact.status} />
                  <span className="text-[11px] text-[var(--text-muted)]">{formatRelativeDate(contact.created_at)}</span>
                </div>
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </Card>
  )
}
