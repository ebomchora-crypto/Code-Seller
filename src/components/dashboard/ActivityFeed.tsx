import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { fadeInUp, staggerContainer } from '@/motion/variants'
import { useRevealOnScroll } from '@/motion/hooks'
import {
  Briefcase,
  FileText,
  Mail,
  MessageCircle,
  Phone,
  Repeat,
  StickyNote,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { formatRelativeDate } from '@/utils/date'
import type { ActivityFeedItem } from '@/types'

interface ActivityFeedProps {
  items: ActivityFeedItem[]
  loading: boolean
  error?: string | null
  onRetry?: () => void
}

const TYPE_ICONS: Record<string, LucideIcon> = {
  note: StickyNote,
  call: Phone,
  email: Mail,
  whatsapp: MessageCircle,
  meeting: Users,
  proposal: FileText,
  proposal_sent: FileText,
  stage_change: Repeat,
  other: Briefcase,
}

function ActivityItem({ item }: { item: ActivityFeedItem }) {
  const [expanded, setExpanded] = useState(false)
  const Icon = TYPE_ICONS[item.type] ?? StickyNote

  return (
    <motion.li variants={fadeInUp} className="relative pb-6 pl-8 last:pb-0">
      <span className="absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--bg-muted)] text-[var(--text-secondary)]">
        <Icon className="h-3.5 w-3.5" />
      </span>

      <div className="flex items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
            item.source === 'crm' ? 'bg-[var(--purple-soft)] text-purple-500' : 'bg-blue-500/10 text-blue-500'
          }`}
        >
          {item.source === 'crm' ? 'CRM' : 'Negócios'}
        </span>
        <time className="text-xs text-[var(--text-muted)]">{formatRelativeDate(item.occurred_at)}</time>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className={`mt-1 block text-left text-sm leading-snug text-[var(--text-secondary)] ${expanded ? '' : 'line-clamp-2'}`}
      >
        {item.content}
      </button>

      {(item.contact_name || item.deal_title) && (
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          {item.contact_id && item.contact_name && (
            <Link to={`/crm/${item.contact_id}`} className="hover:text-purple-500">
              {item.contact_name}
            </Link>
          )}
          {item.deal_id && item.deal_title && (
            <Link to={`/deals/${item.deal_id}`} className="hover:text-purple-500">
              {item.deal_title}
            </Link>
          )}
        </p>
      )}
    </motion.li>
  )
}

export function ActivityFeed({ items, loading, error, onRetry }: ActivityFeedProps) {
  const { ref, isInView } = useRevealOnScroll<HTMLOListElement>()

  return (
    <Card>
      <h3 className="mb-4 text-base font-semibold text-[var(--text-primary)]">Atividades Recentes</h3>

      {loading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex gap-3 pl-1">
              <Skeleton className="h-6 w-6 shrink-0 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="mt-2 h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : items.length === 0 ? (
        <EmptyState title="Nenhuma atividade registrada ainda" />
      ) : (
        <motion.ol
          ref={ref}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={staggerContainer(0.06)}
          className="relative border-l border-[var(--border-subtle)] pl-0"
        >
          {items.map((item) => (
            <ActivityItem key={`${item.source}-${item.id}`} item={item} />
          ))}
        </motion.ol>
      )}
    </Card>
  )
}
