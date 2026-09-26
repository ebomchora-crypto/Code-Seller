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
import { duration, easing } from '@/motion/tokens'

interface DealPipelineProps {
  deals: Deal[]
  loading: boolean
  onStageChange: (id: string, stage: DealStage) => void
}

function DealDraggable({ deal, index }: { deal: Deal; index: number }) {
  const reducedMotion = useReducedMotion()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal.id })

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
      aria-roledescription="Negócio arrastável"
    >
      <DealCard deal={deal} />
    </div>
    </motion.div>
  )
}

function PipelineColumn({ stage, deals }: { stage: DealStage; deals: Deal[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const config = DEAL_STAGES.find((item) => item.key === stage)!
  const totalValue = deals.reduce((sum, deal) => sum + (deal.value ?? 0), 0)
  const closed = stage === 'won' || stage === 'lost'

  return (
    <div
      ref={setNodeRef}
      className={`flex w-[288px] shrink-0 flex-col rounded-[22px] border p-2.5 transition-all duration-200 ${
        isOver
          ? 'border-[var(--accent-ring)] bg-[var(--accent-tint)] shadow-[0_0_0_4px_var(--accent-tint)]'
          : 'border-[var(--border-subtle)] bg-black/[0.02] dark:bg-white/[0.02]'
      }`}
      style={closed && !isOver ? { backgroundColor: `${config.color}0d`, borderColor: `${config.color}33` } : undefined}
    >
      <div className="px-2 pb-3 pt-1.5">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-[13.5px] font-semibold text-[var(--text-primary)]">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: config.color, boxShadow: `0 0 10px ${config.color}` }} />
            {config.label}
          </h3>
          <span className="rounded-full bg-[var(--bg-card)] px-2 py-0.5 text-[12px] font-semibold tabular-nums text-[var(--text-secondary)] ring-1 ring-[var(--border-subtle)]">
            {deals.length}
          </span>
        </div>
        <p className="mt-1 pl-[18px] text-[12.5px] tabular-nums text-[var(--text-muted)]">{formatCurrency(totalValue)}</p>
      </div>

      <div className="flex min-h-24 flex-1 flex-col gap-2.5">
        {deals.map((deal, index) => (
          <DealDraggable key={deal.id} deal={deal} index={index} />
        ))}
        {deals.length === 0 && (
          <p className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-[var(--border-default)] px-4 py-8 text-center text-[12.5px] text-[var(--text-muted)]">
            Arraste um negócio pra cá
          </p>
        )}
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
      <div className="flex gap-3 overflow-x-auto pb-4">
        {DEAL_STAGES.map((stage) => (
          <div key={stage.key} className="flex w-[288px] shrink-0 flex-col gap-2.5 rounded-[22px] border border-[var(--border-subtle)] p-2.5">
            <Skeleton className="m-1.5 h-5 w-24" />
            <Skeleton className="h-36 w-full rounded-[18px]" />
            <Skeleton className="h-36 w-full rounded-[18px]" />
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
      <div className="flex gap-3 overflow-x-auto pb-4">
        {DEAL_STAGES.map((stage) => (
          <PipelineColumn key={stage.key} stage={stage.key} deals={deals.filter((deal) => deal.stage === stage.key)} />
        ))}
      </div>
      <DragOverlay>{activeDeal && <DealCard deal={activeDeal} isDragging />}</DragOverlay>
    </DndContext>
  )
}
