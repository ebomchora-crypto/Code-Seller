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
import { TaskCard } from '@/components/tasks/TaskCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { TASK_STATUS_CONFIG } from '@/utils/tasks'
import type { Task, TaskStatus } from '@/types'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { EASE_PREMIUM } from '@/utils/animations'

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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <motion.div initial={reducedMotion || index >= 15 ? false : { opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: Math.min(index, 14) * 0.05, ease: EASE_PREMIUM }}>
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} aria-roledescription="Tarefa arrastável">
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
      className={`flex w-72 shrink-0 flex-col rounded-xl p-3 transition-colors duration-150 ${isOver ? 'ring-1 ring-purple-200' : ''}`}
      style={{ backgroundColor: config.bg }}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <h3 className="text-sm font-medium" style={{ color: config.color }}>
          {config.label}
        </h3>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-neutral-500">{tasks.length}</span>
      </div>

      <div className="flex max-h-[calc(100vh-320px)] flex-1 flex-col gap-3 overflow-y-auto pr-1">
        <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task, index) => (
            <SortableTaskCard key={task.id} task={task} onOpenTask={onOpenTask} index={index} />
          ))}
        </SortableContext>
      </div>

      <button
        type="button"
        onClick={() => onCreateInColumn(status)}
        className="mt-3 rounded-lg border border-dashed border-neutral-300 py-2 text-xs font-medium text-neutral-500 transition-colors hover:border-purple-300 hover:text-purple-600"
      >
        + Tarefa
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
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_STATUSES.map((status) => (
          <div key={status} className="flex w-72 shrink-0 flex-col gap-3 rounded-xl bg-neutral-50 p-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
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
      <div className="flex gap-4 overflow-x-auto pb-4">
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
