import { useState } from 'react'
import { motion } from 'motion/react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus } from 'lucide-react'
import { TaskCard } from '@/components/tasks/TaskCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { TASK_STATUS_CONFIG } from '@/utils/tasks'
import type { Task, TaskStatus } from '@/types'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { duration, easing } from '@/motion/tokens'

interface TaskKanbanProps {
  tasksByStatus: Map<TaskStatus, Task[]>
  loading: boolean
  onOpenTask: (task: Task) => void
  onStatusChange: (id: string, status: TaskStatus) => void
  onReorder: (orderedIds: string[]) => void
  onCreateInColumn: (status: TaskStatus) => void
}

const KANBAN_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done', 'cancelled']

function SortableTaskCard({ task, onOpenTask, index }: { task: Task; onOpenTask: (task: Task) => void; index: number }) {
  const reducedMotion = useReducedMotion()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })

  // Nota: `transition` aqui vem do dnd-kit (useSortable) e já anima o reflow
  // ao reordenar dentro da coluna — por isso o motion.div abaixo NÃO usa a
  // prop `layout` (evitaria conflitar com a animação própria do dnd-kit).
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    scale: isDragging ? 0.97 : 1,
  }

  return (
    <motion.div
      initial={reducedMotion || index >= 15 ? false : { opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: duration.enter, delay: Math.min(index, 10) * 0.03, ease: easing.standard }}
    >
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="transition-shadow duration-150"
      aria-roledescription="Tarefa arrastável"
    >
      <TaskCard task={task} onOpen={() => onOpenTask(task)} />
    </div>
    </motion.div>
  )
}

function KanbanColumn({
  status,
  tasks,
  onOpenTask,
  onCreateInColumn,
}: {
  status: TaskStatus
  tasks: Task[]
  onOpenTask: (task: Task) => void
  onCreateInColumn: (status: TaskStatus) => void
}) {
  const config = TASK_STATUS_CONFIG[status]
  const { setNodeRef, isOver } = useDroppable({ id: status })

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
          <span className="size-2.5 rounded-full" style={{ backgroundColor: config.color, boxShadow: `0 0 10px ${config.color}` }} />
          {config.label}
        </h3>
        <span className="rounded-full bg-[var(--bg-card)] px-2 py-0.5 text-[12px] font-semibold tabular-nums text-[var(--text-secondary)] ring-1 ring-[var(--border-subtle)]">
          {tasks.length}
        </span>
      </div>

      <div data-lenis-prevent className="flex max-h-[calc(100vh-340px)] min-h-16 flex-1 flex-col gap-2.5 overflow-y-auto">
        <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task, index) => (
            <SortableTaskCard key={task.id} task={task} onOpenTask={onOpenTask} index={index} />
          ))}
        </SortableContext>
      </div>

      <button
        type="button"
        onClick={() => onCreateInColumn(status)}
        className="mt-2.5 flex h-9 items-center justify-center gap-1.5 rounded-xl border border-dashed border-[var(--border-default)] text-[12.5px] font-medium text-[var(--text-muted)] transition-colors hover:border-[var(--accent-ring)] hover:text-[var(--accent-text)]"
      >
        <Plus className="size-3.5" />
        Tarefa
      </button>
    </div>
  )
}

export function TaskKanban({ tasksByStatus, loading, onOpenTask, onStatusChange, onReorder, onCreateInColumn }: TaskKanbanProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const allTasks = KANBAN_STATUSES.flatMap((status) => tasksByStatus.get(status) ?? [])
  const isEmpty = allTasks.length === 0

  function findTaskById(id: string): Task | undefined {
    return allTasks.find((task) => task.id === id)
  }

  function findColumnOf(id: string): TaskStatus | undefined {
    if ((KANBAN_STATUSES as string[]).includes(id)) return id as TaskStatus
    return findTaskById(id)?.status
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveTask(findTaskById(event.active.id as string) ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return

    const task = findTaskById(active.id as string)
    const targetColumn = findColumnOf(over.id as string)
    if (!task || !targetColumn) return

    if (task.status !== targetColumn) {
      onStatusChange(task.id, targetColumn)
      return
    }

    // Reordenar dentro da mesma coluna
    const columnTasks = tasksByStatus.get(targetColumn) ?? []
    const oldIndex = columnTasks.findIndex((item) => item.id === active.id)
    const newIndex = columnTasks.findIndex((item) => item.id === over.id)
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return

    const reordered = [...columnTasks]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)
    onReorder(reordered.map((item) => item.id))
  }

  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-4">
        {KANBAN_STATUSES.map((status) => (
          <div key={status} className="flex w-[288px] shrink-0 flex-col gap-2.5 rounded-[22px] border border-[var(--border-subtle)] p-2.5">
            <Skeleton className="m-1.5 h-5 w-24" />
            <Skeleton className="h-28 w-full rounded-[18px]" />
            <Skeleton className="h-28 w-full rounded-[18px]" />
          </div>
        ))}
      </div>
    )
  }

  if (isEmpty) {
    return (
      <EmptyState
        title="Nenhuma tarefa encontrada"
        description="Crie uma nova tarefa ou ajuste os filtros para ver resultados aqui."
      />
    )
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {KANBAN_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={tasksByStatus.get(status) ?? []}
            onOpenTask={onOpenTask}
            onCreateInColumn={onCreateInColumn}
          />
        ))}
      </div>
      <DragOverlay>{activeTask && <TaskCard task={activeTask} onOpen={() => {}} isDragging />}</DragOverlay>
    </DndContext>
  )
}
