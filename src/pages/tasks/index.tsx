import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Columns3, List, Plus } from 'lucide-react'
import { PageHeader, PageWrapper } from '@/components/ui/PageWrapper'
import { Button } from '@/components/ui/Button'
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
import { useOpenOnParam } from '@/hooks/useOpenOnParam'

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
  useOpenOnParam(openCreateForm)


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
        <PageHeader
          title="Tarefas"
          count={pendingCount}
          subtitle="Seus próximos passos com clientes e negócios, organizados por prazo e prioridade."
          actions={
            <>
              <div
                role="group"
                aria-label="Modo de visualização"
                className="flex h-11 items-center gap-1 rounded-full border border-[var(--border-default)] bg-[var(--bg-card)] p-1"
              >
                {(
                  [
                    { value: 'list', label: 'Lista', icon: List },
                    { value: 'kanban', label: 'Kanban', icon: Columns3 },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={view === option.value}
                    onClick={() => setView(option.value)}
                    className={`flex h-full items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-colors ${
                      view === option.value
                        ? 'bg-[var(--accent-tint)] text-[var(--accent-text)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <option.icon className="size-4" />
                    {option.label}
                  </button>
                ))}
              </div>

              <Button magnetic className="h-11 rounded-full px-5" onClick={openCreateForm}>
                <Plus className="size-4" strokeWidth={2.4} />
                Nova tarefa
              </Button>
            </>
          }
        />

        <div className="mt-8">
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
