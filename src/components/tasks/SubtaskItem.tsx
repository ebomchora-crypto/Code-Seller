import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { TaskCheckbox } from '@/components/tasks/TaskCheckbox'
import type { Task } from '@/types'

interface SubtaskItemProps {
  subtask: Task
  onToggle: () => void
  onRename: (title: string) => void
  onDelete: () => void
}

export function SubtaskItem({ subtask, onToggle, onRename, onDelete }: SubtaskItemProps) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(subtask.title)
  const isDone = subtask.status === 'done'

  function handleBlur() {
    setEditing(false)
    const trimmed = title.trim()
    if (trimmed && trimmed !== subtask.title) {
      onRename(trimmed)
    } else {
      setTitle(subtask.title)
    }
  }

  return (
    <div className="group flex items-center gap-2 py-1.5">
      <TaskCheckbox checked={isDone} onToggle={onToggle} size="sm" ariaLabel={`Concluir subtarefa ${subtask.title}`} />

      {editing ? (
        <input
          autoFocus
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={handleBlur}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur()
            if (event.key === 'Escape') {
              setTitle(subtask.title)
              setEditing(false)
            }
          }}
          className="flex-1 rounded border-b border-purple-300 bg-transparent text-sm text-neutral-800 outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className={`flex-1 text-left text-sm transition-colors duration-150 ${
            isDone ? 'text-neutral-400 line-through' : 'text-neutral-700'
          }`}
        >
          {subtask.title}
        </button>
      )}

      <button
        type="button"
        onClick={onDelete}
        aria-label="Remover subtarefa"
        className="opacity-0 text-neutral-400 transition-opacity duration-150 hover:text-red-600 group-hover:opacity-100"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
