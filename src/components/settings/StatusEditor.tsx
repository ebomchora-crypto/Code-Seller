import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2 } from 'lucide-react'
import { Switch } from '@/components/ui/Switch'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { CATEGORY_COLOR_SWATCHES } from '@/types'
import type { CRMStatus } from '@/types'

interface StatusEditorProps {
  status: CRMStatus
  onUpdate: (data: Partial<CRMStatus>) => void
  onDelete: () => void
}

export function StatusEditor({ status, onUpdate, onDelete }: StatusEditorProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: status.id })
  const [name, setName] = useState(status.name)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-3 ${isDragging ? 'shadow-[var(--shadow-modal)]' : ''}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Reordenar status"
        className="cursor-grab text-[var(--text-muted)] hover:text-[var(--text-primary)] active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex gap-1">
        {CATEGORY_COLOR_SWATCHES.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={`Cor ${color}`}
            onClick={() => onUpdate({ color })}
            className={`size-5 rounded-full transition ${status.color === color ? 'ring-2 ring-[var(--text-primary)] ring-offset-2 ring-offset-[var(--bg-card)]' : 'opacity-70 hover:opacity-100'}`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        onBlur={() => name.trim() && name !== status.name && onUpdate({ name: name.trim() })}
        aria-label="Nome"
        className="min-w-[8rem] flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-[14px] font-medium text-[var(--text-primary)] outline-none hover:border-[var(--border-default)] focus:border-[var(--accent-ring)]"
      />

      <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
        <Switch checked={status.is_default} onChange={(checked) => onUpdate({ is_default: checked })} ariaLabel="Status padrão" />
        Padrão
      </label>

      <button
        type="button"
        onClick={() => setDeleteOpen(true)}
        aria-label="Excluir status"
        className="flex size-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition hover:bg-red-500/10 hover:text-red-500"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <ConfirmDialog
        open={deleteOpen}
        title="Excluir status"
        message={`Tem certeza que deseja excluir o status "${status.name}"?`}
        confirmLabel="Excluir"
        onConfirm={() => {
          setDeleteOpen(false)
          onDelete()
        }}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  )
}
