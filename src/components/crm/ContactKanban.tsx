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
import { duration, easing } from '@/motion/tokens'

interface ContactKanbanProps {
  contacts: Contact[]
  loading: boolean
  onStatusChange: (id: string, status: ContactStatus) => void
}

const columnHeaderClasses: Record<ContactStatus, string> = {
  lead: 'text-purple-700',
  negotiating: 'text-amber-700',
  client: 'text-emerald-700',
  inactive: 'text-neutral-500',
  lost: 'text-red-700',
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

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-xl bg-neutral-50 p-3 transition-all duration-200 ${
        isOver ? 'scale-[1.01] bg-purple-50/70 ring-2 ring-purple-300 shadow-[0_0_24px_rgba(179,92,255,0.12)]' : ''
      }`}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <h3 className={`text-sm font-medium ${columnHeaderClasses[status]}`}>
          {CONTACT_STATUS_LABELS[status]}
        </h3>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-neutral-500">
          {contacts.length}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3">
        {contacts.map((contact, index) => (
          <KanbanCard key={contact.id} contact={contact} index={index} />
        ))}
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
          <div key={status} className="flex w-72 shrink-0 flex-col gap-3 rounded-xl bg-neutral-50 p-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
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
      <div className="flex gap-4 overflow-x-auto pb-4">
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
