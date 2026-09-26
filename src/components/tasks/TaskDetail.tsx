import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { TaskCheckbox } from '@/components/tasks/TaskCheckbox'
import { PriorityBadge } from '@/components/tasks/PriorityBadge'
import { StatusBadge } from '@/components/tasks/StatusBadge'
import { DueDateLabel } from '@/components/tasks/DueDateLabel'
import { SubtaskList } from '@/components/tasks/SubtaskList'
import { TagManager } from '@/components/crm/TagManager'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useTags } from '@/hooks/useTags'
import { TASK_PRIORITY_CONFIG, TASK_RECURRENCE_LABELS, TASK_STATUS_CONFIG } from '@/utils/tasks'
import type { Tag, Task, TaskPriority, TaskStatus } from '@/types'

interface TaskDetailProps {
  task: Task
  onUpdate: (data: Partial<Task>) => Promise<void>
  onComplete: () => Promise<void>
  onReopen: () => Promise<void>
  onDelete: () => Promise<void>
  onEdit: () => void
  onAddSubtask: (title: string) => void
  onToggleSubtask: (id: string, currentStatus: TaskStatus) => void
  onRenameSubtask: (id: string, title: string) => void
  onDeleteSubtask: (id: string) => void
  onAddTag: (tag: Tag) => Promise<void>
  onRemoveTag: (tagId: string) => Promise<void>
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function TaskDetail({
  task,
  onUpdate,
  onComplete,
  onReopen,
  onDelete,
  onEdit,
  onAddSubtask,
  onToggleSubtask,
  onRenameSubtask,
  onDeleteSubtask,
  onAddTag,
  onRemoveTag,
}: TaskDetailProps) {
  const { tags: allTags, createTag } = useTags()
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(task.title)
  const [priorityMenuOpen, setPriorityMenuOpen] = useState(false)
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)
  const priorityRef = useRef<HTMLDivElement>(null)
  const statusRef = useRef<HTMLDivElement>(null)
  const [editingDescription, setEditingDescription] = useState(false)
  const [descriptionValue, setDescriptionValue] = useState(task.description ?? '')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setTitleValue(task.title)
    setDescriptionValue(task.description ?? '')
  }, [task.id, task.title, task.description])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (priorityRef.current && !priorityRef.current.contains(event.target as Node)) setPriorityMenuOpen(false)
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) setStatusMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleTitleBlur() {
    setEditingTitle(false)
    const trimmed = titleValue.trim()
    if (trimmed && trimmed !== task.title) void onUpdate({ title: trimmed })
    else setTitleValue(task.title)
  }

  function handleDescriptionBlur() {
    setEditingDescription(false)
    if (descriptionValue.trim() !== (task.description ?? '')) {
      void onUpdate({ description: descriptionValue.trim() || null })
    }
  }

  async function handlePrioritySelect(priority: TaskPriority) {
    setPriorityMenuOpen(false)
    if (priority !== task.priority) await onUpdate({ priority })
  }

  async function handleStatusSelect(status: TaskStatus) {
    setStatusMenuOpen(false)
    if (status === task.status) return
    if (status === 'done') await onComplete()
    else await onUpdate({ status, completed_at: status === 'todo' ? null : task.completed_at })
  }

  async function handleConfirmDelete() {
    setDeleting(true)
    await onDelete()
    setDeleting(false)
    setDeleteOpen(false)
  }

  const isDone = task.status === 'done'

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-start gap-3">
          <div className="pt-1">
            <TaskCheckbox
              checked={isDone}
              onToggle={() => (isDone ? onReopen() : onComplete())}
              ariaLabel="Concluir tarefa"
            />
          </div>
          {editingTitle ? (
            <input
              autoFocus
              value={titleValue}
              onChange={(event) => setTitleValue(event.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()}
              className="flex-1 rounded-lg border border-[var(--accent-ring)] bg-[var(--field-bg)] px-2 py-1 font-display text-xl font-semibold text-[var(--text-primary)] outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingTitle(true)}
              className={`flex-1 rounded-lg px-1 text-left font-display text-xl font-semibold leading-snug transition-colors hover:bg-[var(--bg-muted)] ${
                isDone ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-primary)]'
              }`}
            >
              {task.title}
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div ref={priorityRef} className="relative">
            <PriorityBadge priority={task.priority} onClick={() => setPriorityMenuOpen((value) => !value)} />
            {priorityMenuOpen && (
              <div className="absolute left-0 top-full z-20 mt-2 w-40 animate-fade-in overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--panel-bg)] p-1.5 shadow-[var(--shadow-modal)]">
                {(Object.keys(TASK_PRIORITY_CONFIG) as TaskPriority[]).map((priority) => (
                  <button
                    key={priority}
                    type="button"
                    onClick={() => handlePrioritySelect(priority)}
                    className="block w-full rounded-xl px-3 py-2 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
                  >
                    {TASK_PRIORITY_CONFIG[priority].label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div ref={statusRef} className="relative">
            <StatusBadge status={task.status} onClick={() => setStatusMenuOpen((value) => !value)} />
            {statusMenuOpen && (
              <div className="absolute left-0 top-full z-20 mt-2 w-44 animate-fade-in overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--panel-bg)] p-1.5 shadow-[var(--shadow-modal)]">
                {(Object.keys(TASK_STATUS_CONFIG) as TaskStatus[]).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleStatusSelect(status)}
                    className="block w-full rounded-xl px-3 py-2 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
                  >
                    {TASK_STATUS_CONFIG[status].label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button variant="secondary" size="sm" className="h-9 rounded-full px-4" onClick={onEdit}>
            Editar
          </Button>
          <Button variant="danger" size="sm" className="h-9 rounded-full px-4" onClick={() => setDeleteOpen(true)}>
            Excluir
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 border-t border-[var(--border-subtle)] pt-5 sm:grid-cols-2">
        <div>
          <p className="text-[12px] text-[var(--text-muted)]">Vencimento</p>
          <div className="mt-1">
            <DueDateLabel due_date={task.due_date} completed_at={task.completed_at} />
            {!task.due_date && <span className="text-sm text-[var(--text-muted)]">Sem data definida</span>}
          </div>
        </div>
        <div>
          <p className="text-[12px] text-[var(--text-muted)]">Lembrete</p>
          <p className="mt-1 text-sm text-[var(--text-primary)]">
            {task.reminder_at ? formatDateTime(task.reminder_at) : '—'}
          </p>
        </div>
        <div>
          <p className="text-[12px] text-[var(--text-muted)]">Recorrência</p>
          <p className="mt-1 text-sm text-[var(--text-primary)]">{TASK_RECURRENCE_LABELS[task.recurrence]}</p>
        </div>
        <div>
          <p className="text-[12px] text-[var(--text-muted)]">Contato vinculado</p>
          {task.contact ? (
            <Link to={`/crm/${task.contact.id}`} className="mt-1 block text-sm text-[var(--accent-text)] hover:underline">
              {task.contact.name}
            </Link>
          ) : (
            <p className="mt-1 text-sm text-[var(--text-muted)]">—</p>
          )}
        </div>
        <div>
          <p className="text-[12px] text-[var(--text-muted)]">Negócio vinculado</p>
          {task.deal ? (
            <Link to={`/deals/${task.deal.id}`} className="mt-1 block text-sm text-[var(--accent-text)] hover:underline">
              {task.deal.title}
            </Link>
          ) : (
            <p className="mt-1 text-sm text-[var(--text-muted)]">—</p>
          )}
        </div>
        <div>
          <p className="text-[12px] text-[var(--text-muted)]">Criado em</p>
          <p className="mt-1 text-sm text-[var(--text-primary)]">{formatDateTime(task.created_at)}</p>
        </div>
      </div>

      <div className="border-t border-[var(--border-subtle)] pt-5">
        <p className="mb-2 text-[13px] font-semibold text-[var(--text-primary)]">Tags</p>
        <TagManager
          contactTags={task.tags ?? []}
          availableTags={allTags}
          onAdd={(tag) => void onAddTag(tag)}
          onRemove={(tagId) => void onRemoveTag(tagId)}
          onCreate={createTag}
        />
      </div>

      <div className="border-t border-[var(--border-subtle)] pt-5">
        <p className="mb-2 text-[13px] font-semibold text-[var(--text-primary)]">Descrição</p>
        {editingDescription ? (
          <textarea
            autoFocus
            value={descriptionValue}
            onChange={(event) => setDescriptionValue(event.target.value)}
            onBlur={handleDescriptionBlur}
            rows={4}
            className="w-full resize-none rounded-xl border border-[var(--accent-ring)] bg-[var(--field-bg)] p-3 text-sm text-[var(--text-primary)] outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingDescription(true)}
            className="block w-full rounded-xl border border-dashed border-[var(--border-default)] p-3 text-left text-sm text-[var(--text-primary)] hover:border-[var(--border-strong)]"
          >
            {task.description || <span className="text-[var(--text-muted)]">Adicionar descrição…</span>}
          </button>
        )}
      </div>

      <div className="border-t border-[var(--border-subtle)] pt-5">
        <SubtaskList
          subtasks={task.subtasks ?? []}
          onAdd={onAddSubtask}
          onToggle={onToggleSubtask}
          onRename={onRenameSubtask}
          onDelete={onDeleteSubtask}
        />
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Excluir tarefa"
        message={`Tem certeza que deseja excluir "${task.title}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  )
}
