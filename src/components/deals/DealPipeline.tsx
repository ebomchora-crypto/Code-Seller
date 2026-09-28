import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BoardTabs, MoveToSelect } from '@/components/ui/BoardControls'
import { useMediaQuery } from '@/hooks/useMediaQuery'
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
      className={`flex min-w-0 flex-col rounded-[22px] border p-2 transition-all duration-200 ${
        isOver
          ? 'border-[var(--accent-ring)] bg-[var(--accent-tint)] shadow-[0_0_0_4px_var(--accent-tint)]'
          : 'border-[var(--border-subtle)] bg-black/[0.02] dark:bg-white/[0.02]'
      }`}
      style={closed && !isOver ? { backgroundColor: `${config.color}0d`, borderColor: `${config.color}33` } : undefined}
    >
      <div className="px-2 pb-3 pt-1.5">
        <div className="flex items-center justify-between">
          <h3 className="flex min-w-0 items-center gap-2 truncate text-[13.5px] font-semibold text-[var(--text-primary)]">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: config.color, boxShadow: `0 0 10px ${config.color}` }} />
            {config.label}
          </h3>
          <span className="rounded-full bg-[var(--bg-card)] px-2 py-0.5 text-[12px] font-semibold tabular-nums text-[var(--text-secondary)] ring-1 ring-[var(--border-subtle)]">
            {deals.length}
          </span>
        </div>
        <p className="mt-1 pl-[18px] text-[12.5px] tabular-nums text-[var(--text-muted)]">{formatCurrency(totalValue)}</p>
      </div>

      <div className="flex min-h-24 flex-1 flex-col gap-2">
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

const OPEN_STAGES = DEAL_STAGES.filter((stage) => stage.key !== 'won' && stage.key !== 'lost')
const CLOSED_STAGES = DEAL_STAGES.filter((stage) => stage.key === 'won' || stage.key === 'lost')
const STAGE_OPTIONS = DEAL_STAGES.map((stage) => ({ key: stage.key, label: stage.label }))
const CLOSED_PREVIEW = 6

function closedAt(deal: Deal): number {
  return new Date(deal.won_at ?? deal.updated_at).getTime()
}

// Ganho e Perdido crescem para sempre: ficam embaixo do quadro, como áreas
// para soltar o negócio, mostrando só os mais recentes.
function ClosedZone({ stage, deals }: { stage: DealStage; deals: Deal[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const [expanded, setExpanded] = useState(false)
  const config = DEAL_STAGES.find((item) => item.key === stage)!
  const total = deals.reduce((sum, deal) => sum + (deal.value ?? 0), 0)
  const sorted = [...deals].sort((a, b) => closedAt(b) - closedAt(a))
  const shown = expanded ? sorted : sorted.slice(0, CLOSED_PREVIEW)

  return (
    <div
      ref={setNodeRef}
      className={`rounded-[22px] border p-3 transition-all duration-200 ${
        isOver ? 'border-[var(--accent-ring)] bg-[var(--accent-tint)] shadow-[0_0_0_4px_var(--accent-tint)]' : ''
      }`}
      style={isOver ? undefined : { backgroundColor: `${config.color}0d`, borderColor: `${config.color}33` }}
    >
      <div className="flex items-center justify-between gap-3 px-1">
        <h3 className="flex items-center gap-2 text-[13.5px] font-semibold text-[var(--text-primary)]">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: config.color, boxShadow: `0 0 10px ${config.color}` }} />
          {config.label}
          <span className="font-normal tabular-nums text-[var(--text-muted)]">
            {deals.length} · {formatCurrency(total)}
          </span>
        </h3>
        <span className="text-[12px] text-[var(--text-muted)]">Arraste um negócio pra cá</span>
      </div>
      {deals.length > 0 && (
        <ul className="mt-2.5 grid gap-1.5 sm:grid-cols-2">
          {shown.map((deal) => (
            <li key={deal.id}>
              <Link
                to={`/deals/${deal.id}`}
                className="flex items-center justify-between gap-3 rounded-xl bg-[var(--bg-card)] px-3 py-2 text-[13px] ring-1 ring-[var(--border-subtle)] transition hover:ring-[var(--accent-ring)]"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-[var(--text-primary)]">{deal.title}</span>
                  {deal.contact && <span className="block truncate text-[11.5px] text-[var(--text-muted)]">{deal.contact.name}</span>}
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-[var(--text-secondary)]">{formatCurrency(deal.value)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {deals.length > CLOSED_PREVIEW && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-2 px-1 text-[12.5px] font-medium text-[var(--accent-text)] hover:underline"
        >
          {expanded ? 'Mostrar menos' : `Ver todos (${deals.length})`}
        </button>
      )}
    </div>
  )
}

export function DealPipeline({ deals, loading, onStageChange }: DealPipelineProps) {
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null)
  const [tab, setTab] = useState<DealStage>('contact')
  // Tela grande: etapas abertas lado a lado, sem rolar para o lado.
  // Menor que isso: uma etapa por vez, escolhida nas abas.
  const wide = useMediaQuery('(min-width: 1360px)')
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
      <div className="grid grid-cols-1 gap-2.5 min-[1360px]:grid-cols-5">
        {OPEN_STAGES.map((stage, index) => (
          <div
            key={stage.key}
            className={`flex flex-col gap-2 rounded-[22px] border border-[var(--border-subtle)] p-2 ${index > 0 ? 'hidden min-[1360px]:flex' : ''}`}
          >
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

  if (!wide) {
    const inTab = deals.filter((deal) => deal.stage === tab)
    const tabTotal = inTab.reduce((sum, deal) => sum + (deal.value ?? 0), 0)
    return (
      <div className="flex flex-col gap-4">
        <BoardTabs
          label="Etapa"
          value={tab}
          onChange={setTab}
          options={DEAL_STAGES.map((stage) => ({
            key: stage.key,
            label: stage.label,
            color: stage.color,
            count: deals.filter((deal) => deal.stage === stage.key).length,
          }))}
        />
        {inTab.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--border-default)] px-4 py-10 text-center text-[13px] text-[var(--text-muted)]">
            Nenhum negócio em {DEAL_STAGES.find((stage) => stage.key === tab)?.label}.
          </p>
        ) : (
          <>
            <p className="text-[13px] tabular-nums text-[var(--text-muted)]">Total da etapa: {formatCurrency(tabTotal)}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {inTab.map((deal) => (
                <div key={deal.id}>
                  <DealCard deal={deal} />
                  <MoveToSelect
                    current={deal.stage}
                    options={STAGE_OPTIONS}
                    itemName={deal.title}
                    onMove={(stage) => stage !== deal.stage && onStageChange(deal.id, stage)}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-5 gap-2.5">
        {OPEN_STAGES.map((stage) => (
          <PipelineColumn key={stage.key} stage={stage.key} deals={deals.filter((deal) => deal.stage === stage.key)} />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2.5 pb-4">
        {CLOSED_STAGES.map((stage) => (
          <ClosedZone key={stage.key} stage={stage.key} deals={deals.filter((deal) => deal.stage === stage.key)} />
        ))}
      </div>
      <DragOverlay>{activeDeal && <DealCard deal={activeDeal} isDragging />}</DragOverlay>
    </DndContext>
  )
}
