import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageWrapper } from '@/components/ui/PageWrapper'
import { SectionLabel } from '@/components/ui/section-label'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Drawer } from '@/components/ui/Drawer'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ErrorState } from '@/components/ui/ErrorState'
import { TaskFilters } from '@/components/tasks/TaskFilters'
import { TaskList } from '@/components/tasks/TaskList'
import { TaskKanban } from '@/components/tasks/TaskKanban'
import { TaskForm } from '@/components/tasks/TaskForm'
import { TaskDetail } from '@/components/tasks/TaskDetail'
import { useTasks } from '@/hooks/useTasks'
import { useTask } from '@/hooks/useTask'
import type { Task, TaskStatus } from '@/types'

function ListIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={`h-4 w-4 ${active ? 'text-purple-600' : 'text-neutral-400'}`}>
      <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

function KanbanIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={`h-4 w-4 ${active ? 'text-purple-600' : 'text-neutral-400'}`}>
      <rect x="3" y="4" width="5" height="16" rx="1" />
      <rect x="9.5" y="4" width="5" height="10" rx="1" />
      <rect x="16" y="4" width="5" height="13" rx="1" />
    </svg>
  )
}

export default function TasksPage() {
  const {
    tasks,
    tasksByStatus,
    loading,
    error,
    filters,
    setFilters,
    clearFilters,
    hasActiveFilters,
    view,
    setView,
    refetch,
    completeTask,
    deleteTask,
    updateStatus,
    reorder,
  } = useTasks()

  const [searchParams, setSearchParams] = useSearchParams()
  const presetContactId = searchParams.get('contact_id') ?? undefined
  const presetContactName = searchParams.get('contact_name') ?? undefined
  const presetDealId = searchParams.get('deal_id') ?? undefined
  const presetDealTitle = searchParams.get('deal_title') ?? undefined

  const [formOpen, setFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [statusForNewTask, setStatusForNewTask] = useState<TaskStatus | undefined>(undefined)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [deletingTask, setDeletingTask] = useState<Task | null>(null)
  const [deleting, setDeleting] = useState(false)

  const {
    task: selectedTask,
    updateTask: updateSelectedTask,
    completeTask: completeSelectedTask,
    reopenTask: reopenSelectedTask,
    createSubtask,
    updateSubtask,
    deleteSubtask,
    addTag,
    removeTag,
    refetch: refetchSelectedTask,
  } = useTask(selectedTaskId ?? undefined)

  useEffect(() => {
    if (presetContactId || presetDealId) {
      setEditingTask(null)
      setStatusForNewTask(undefined)
      setFormOpen(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetContactId, presetDealId])

  function clearPresetParams() {
    if (presetContactId || presetDealId) {
      searchParams.delete('contact_id')
      searchParams.delete('contact_name')
      searchParams.delete('deal_id')
      searchParams.delete('deal_title')
      setSearchParams(searchParams, { replace: true })
    }
  }

  function openCreateForm() {
    setEditingTask(null)
    setStatusForNewTask(undefined)
    setFormOpen(true)
  }

  function openCreateInColumn(status: TaskStatus) {
    setEditingTask(null)
    setStatusForNewTask(status)
    setFormOpen(true)
  }

  function openEditForm(task: Task) {
    setEditingTask(task)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    clearPresetParams()
  }

  async function handleConfirmDelete() {
    if (!deletingTask) return
    setDeleting(true)
    await deleteTask(deletingTask.id)
    setDeleting(false)
    setDeletingTask(null)
    if (selectedTaskId === deletingTask.id) setSelectedTaskId(null)
  }

  const pendingCount = tasks.filter((task) => task.status === 'todo' || task.status === 'in_progress').length

  return (
    <PageWrapper>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <SectionLabel>Tarefas</SectionLabel>
            <h1 className="mt-2 flex items-center gap-3 font-display text-4xl font-bold tracking-tight text-[var(--text-primary)]">
              Tarefas
              {pendingCount > 0 && <Badge variant="purple">{pendingCount} pendentes</Badge>}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white p-1">
              <button
                type="button"
                aria-label="Visualização em lista"
                aria-pressed={view === 'list'}
                onClick={() => setView('list')}
                className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${view === 'list' ? 'bg-purple-50' : 'hover:bg-neutral-50'}`}
              >
                <ListIcon active={view === 'list'} />
              </button>
              <button
                type="button"
                aria-label="Visualização em kanban"
                aria-pressed={view === 'kanban'}
                onClick={() => setView('kanban')}
                className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${view === 'kanban' ? 'bg-purple-50' : 'hover:bg-neutral-50'}`}
              >
                <KanbanIcon active={view === 'kanban'} />
              </button>
            </div>

            <Button onClick={openCreateForm}>+ Nova Tarefa</Button>
          </div>
        </div>

        <div className="mt-6">
          <TaskFilters filters={filters} onChange={setFilters} onClear={clearFilters} hasActiveFilters={hasActiveFilters} />
        </div>

        <div className="mt-6">
          {error ? (
            <ErrorState message={error} onRetry={refetch} />
          ) : view === 'list' ? (
            <TaskList
              tasks={tasks}
              loading={loading}
              hasActiveFilters={hasActiveFilters}
              filters={filters}
              onOpenTask={(task) => setSelectedTaskId(task.id)}
              onComplete={completeTask}
              onDeleteRequest={setDeletingTask}
              onCreateTask={openCreateForm}
            />
          ) : (
            <TaskKanban
              tasksByStatus={tasksByStatus}
              loading={loading}
              onOpenTask={(task) => setSelectedTaskId(task.id)}
              onStatusChange={updateStatus}
              onReorder={reorder}
              onCreateInColumn={openCreateInColumn}
            />
          )}
        </div>

        <Drawer open={formOpen} onClose={closeForm} title={editingTask ? 'Editar tarefa' : 'Nova tarefa'}>
          <TaskForm
            task={editingTask ?? undefined}
            defaultStatus={statusForNewTask}
            defaultContactId={editingTask ? undefined : presetContactId}
            defaultContactName={editingTask ? undefined : presetContactName}
            defaultDealId={editingTask ? undefined : presetDealId}
            defaultDealTitle={editingTask ? undefined : presetDealTitle}
            onCancel={closeForm}
            onSuccess={() => {
              closeForm()
              void refetch()
              if (selectedTaskId) void refetchSelectedTask()
            }}
          />
        </Drawer>

        <Drawer open={selectedTaskId !== null} onClose={() => setSelectedTaskId(null)} title="Detalhes da tarefa">
          {selectedTask && (
            <TaskDetail
              task={selectedTask}
              onUpdate={async (data) => {
                await updateSelectedTask(data)
                void refetch()
              }}
              onComplete={async () => {
                await completeSelectedTask()
                void refetch()
              }}
              onReopen={async () => {
                await reopenSelectedTask()
                void refetch()
              }}
              onDelete={async () => {
                await deleteTask(selectedTask.id)
                setSelectedTaskId(null)
              }}
              onEdit={() => openEditForm(selectedTask)}
              onAddSubtask={createSubtask}
              onToggleSubtask={(id, currentStatus) => {
                const subtask = selectedTask.subtasks?.find((item) => item.id === id)
                if (!subtask) return
                void updateSubtask(id, { title: subtask.title, status: currentStatus === 'done' ? 'todo' : 'done' })
              }}
              onRenameSubtask={(id, title) => {
                const subtask = selectedTask.subtasks?.find((item) => item.id === id)
                if (!subtask) return
                void updateSubtask(id, { title, status: subtask.status })
              }}
              onDeleteSubtask={deleteSubtask}
              onAddTag={addTag}
              onRemoveTag={removeTag}
            />
          )}
        </Drawer>

        <ConfirmDialog
          open={deletingTask !== null}
          title="Excluir tarefa"
          message={`Tem certeza que deseja excluir "${deletingTask?.title}"? Essa ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          loading={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingTask(null)}
        />
    </PageWrapper>
  )
}
