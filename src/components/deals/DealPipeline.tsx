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
import { DealCard } from '@/components/deals/DealCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { DEAL_STAGES, formatCurrency } from '@/utils/deals'
import type { Deal, DealStage } from '@/types'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { EASE_PREMIUM } from '@/utils/animations'

interface DealPipelineProps {
  deals: Deal[]
  loading: boolean
  onStageChange: (id: string, stage: DealStage) => void
}

const columnBackground: Partial<Record<DealStage, string>> = {
  won: 'bg-emerald-50/60',
  lost: 'bg-red-50/60',
}

function DealDraggable({ deal, index }: { deal: Deal; index: number }) {
  const reducedMotion = useReducedMotion()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal.id })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.4 : 1 }
    : undefined

  return (
    <motion.div initial={reducedMotion || index >= 15 ? false : { opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: Math.min(index, 14) * 0.05, ease: EASE_PREMIUM }}>
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} aria-roledescription="Negócio arrastável">
      <DealCard deal={deal} />
    </div>
    </motion.div>
  )
}

function PipelineColumn({ stage, deals }: { stage: DealStage; deals: Deal[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const config = DEAL_STAGES.find((item) => item.key === stage)!
  const totalValue = deals.reduce((sum, deal) => sum + (deal.value ?? 0), 0)

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-2xl border border-[var(--border-subtle)] p-3 transition-colors duration-150 ${
        columnBackground[stage] ?? 'bg-[var(--bg-secondary)]'
      } ${isOver ? 'ring-1 ring-purple-300' : ''}`}
    >
      <div className="mb-1 flex items-center justify-between px-1">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: config.color }} />
          <span style={{ color: config.color }}>{config.label}</span>
        </h3>
        <span className="rounded-full bg-[var(--bg-card)] px-2 py-0.5 text-xs font-medium text-[var(--text-muted)]">
          {deals.length}
        </span>
      </div>
      <p className="mb-3 px-1 text-xs text-[var(--text-muted)]">{formatCurrency(totalValue)}</p>

      <div className="flex flex-1 flex-col gap-3">
        {deals.map((deal, index) => (
          <DealDraggable key={deal.id} deal={deal} index={index} />
        ))}
      </div>
    </div>
  )
}

export function DealPipeline({ deals, loading, onStageChange }: DealPipelineProps) {
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  function handleDragStart(event: DragStartEvent) {
    const deal = deals.find((item) => item.id === event.active.id)
    setActiveDeal(deal ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDeal(null)
    const { active, over } = event
    if (!over) return

    const newStage = over.id as DealStage
    const deal = deals.find((item) => item.id === active.id)
    if (deal && deal.stage !== newStage) {
      onStageChange(deal.id, newStage)
    }
  }

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {DEAL_STAGES.map((stage) => (
          <div key={stage.key} className="flex w-72 shrink-0 flex-col gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ))}
      </div>
    )
  }

  if (deals.length === 0) {
    return (
      <EmptyState
        title="Nenhum negócio encontrado"
        description="Crie um novo negócio ou ajuste os filtros para ver resultados aqui."
      />
    )
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {DEAL_STAGES.map((stage) => (
          <PipelineColumn key={stage.key} stage={stage.key} deals={deals.filter((deal) => deal.stage === stage.key)} />
        ))}
      </div>
      <DragOverlay>{activeDeal && <DealCard deal={activeDeal} isDragging />}</DragOverlay>
    </DndContext>
  )
}
