import { useState } from 'react'
import { motion } from 'motion/react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { ContactCard } from '@/components/crm/ContactCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { CONTACT_STATUSES, CONTACT_STATUS_LABELS, type Contact, type ContactStatus } from '@/types'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { CONTACT_STATUS_COLORS } from '@/components/crm/statusColors'
import { duration, easing } from '@/motion/tokens'

interface ContactKanbanProps {
  contacts: Contact[]
  loading: boolean
  onStatusChange: (id: string, status: ContactStatus) => void
}

function KanbanCard({ contact, index }: { contact: Contact; index: number }) {
  const reducedMotion = useReducedMotion()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: contact.id,
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${isDragging ? 0.97 : 1})`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined

  return (
    <motion.div
      layout={!reducedMotion}
      initial={reducedMotion || index >= 15 ? false : { opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: duration.enter, delay: Math.min(index, 10) * 0.03, ease: easing.standard }}
    >
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="transition-shadow duration-150"
      aria-roledescription="Contato arrastável"
    >
      <ContactCard contact={contact} />
    </div>
    </motion.div>
  )
}

function KanbanColumn({
  status,
  contacts,
}: {
  status: ContactStatus
  contacts: Contact[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const color = CONTACT_STATUS_COLORS[status]

  return (
    <div
      ref={setNodeRef}
      className={`flex w-[288px] shrink-0 flex-col rounded-[22px] border p-2.5 transition-all duration-200 ${
        isOver
          ? 'border-[var(--accent-ring)] bg-[var(--accent-tint)] shadow-[0_0_0_4px_var(--accent-tint)]'
          : 'border-[var(--border-subtle)] bg-black/[0.02] dark:bg-white/[0.02]'
      }`}
    >
      <div className="mb-2.5 flex items-center justify-between px-2 pt-1.5">
        <h3 className="flex items-center gap-2 text-[13.5px] font-semibold text-[var(--text-primary)]">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }} />
          {CONTACT_STATUS_LABELS[status]}
        </h3>
        <span className="rounded-full bg-[var(--bg-card)] px-2 py-0.5 text-[12px] font-semibold tabular-nums text-[var(--text-secondary)] ring-1 ring-[var(--border-subtle)]">
          {contacts.length}
        </span>
      </div>

      <div className="flex min-h-24 flex-1 flex-col gap-2.5">
        {contacts.map((contact, index) => (
          <KanbanCard key={contact.id} contact={contact} index={index} />
        ))}
        {contacts.length === 0 && (
          <p className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-[var(--border-default)] px-4 py-8 text-center text-[12.5px] text-[var(--text-muted)]">
            Arraste um contato pra cá
          </p>
        )}
      </div>
    </div>
  )
}

export function ContactKanban({ contacts, loading, onStatusChange }: ContactKanbanProps) {
  const [activeContact, setActiveContact] = useState<Contact | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  function handleDragStart(event: DragStartEvent) {
    const contact = contacts.find((item) => item.id === event.active.id)
    setActiveContact(contact ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveContact(null)
    const { active, over } = event
    if (!over) return

    const newStatus = over.id as ContactStatus
    const contact = contacts.find((item) => item.id === active.id)
    if (contact && contact.status !== newStatus) {
      onStatusChange(contact.id, newStatus)
    }
  }

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {CONTACT_STATUSES.map((status) => (
          <div key={status} className="flex w-[288px] shrink-0 flex-col gap-2.5 rounded-[22px] border border-[var(--border-subtle)] p-2.5">
            <Skeleton className="m-1.5 h-5 w-24" />
            <Skeleton className="h-32 w-full rounded-[18px]" />
            <Skeleton className="h-32 w-full rounded-[18px]" />
          </div>
        ))}
      </div>
    )
  }

  if (contacts.length === 0) {
    return (
      <EmptyState
        title="Nenhum contato encontrado"
        description="Adicione um novo contato ou ajuste os filtros para ver resultados aqui."
      />
    )
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {CONTACT_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            contacts={contacts.filter((contact) => contact.status === status)}
          />
        ))}
      </div>
      <DragOverlay>{activeContact && <ContactCard contact={activeContact} isDragging />}</DragOverlay>
    </DndContext>
  )
}
