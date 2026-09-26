import { useState, type KeyboardEvent } from 'react'
import { SubtaskItem } from '@/components/tasks/SubtaskItem'
import { Input } from '@/components/ui/Input'
import { getSubtaskProgress } from '@/utils/tasks'
import type { Task } from '@/types'

interface SubtaskListProps {
  subtasks: Task[]
  onAdd: (title: string) => void
  onToggle: (id: string, currentStatus: Task['status']) => void
  onRename: (id: string, title: string) => void
  onDelete: (id: string) => void
}

const MAX_SUBTASKS = 20

export function SubtaskList({ subtasks, onAdd, onToggle, onRename, onDelete }: SubtaskListProps) {
  const [newTitle, setNewTitle] = useState('')
  const progress = getSubtaskProgress(subtasks)
  const limitReached = subtasks.length >= MAX_SUBTASKS

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      if (newTitle.trim() && !limitReached) {
        onAdd(newTitle.trim())
        setNewTitle('')
      }
    } else if (event.key === 'Escape') {
      setNewTitle('')
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[12px] text-[var(--text-muted)]">Subtarefas</p>
        {progress.total > 0 && (
          <span className="text-xs text-[var(--text-muted)]">
            {progress.done} de {progress.total} concluídas
          </span>
        )}
      </div>

      {progress.total > 0 && (
        <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-muted)]">
          <div
            className="h-full rounded-full bg-[var(--accent-solid)] transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      )}

      <div className="divide-y divide-[var(--border-subtle)]">
        {subtasks.map((subtask) => (
          <SubtaskItem
            key={subtask.id}
            subtask={subtask}
            onToggle={() => onToggle(subtask.id, subtask.status)}
            onRename={(title) => onRename(subtask.id, title)}
            onDelete={() => onDelete(subtask.id)}
          />
        ))}
      </div>

      {limitReached ? (
        <p className="mt-2 text-xs text-amber-600">Limite de {MAX_SUBTASKS} subtarefas atingido.</p>
      ) : (
        <Input
          placeholder="Adicionar subtarefa e pressionar Enter"
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          onKeyDown={handleKeyDown}
          className="mt-2"
        />
      )}
    </div>
  )
}
