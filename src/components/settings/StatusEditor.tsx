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
      className={`flex flex-wrap items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3 ${isDragging ? 'shadow-lg' : ''}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Reordenar status"
        className="cursor-grab text-neutral-300 hover:text-neutral-500"
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
            className={`h-5 w-5 rounded-full ${status.color === color ? 'ring-2 ring-offset-1' : ''}`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        onBlur={() => name.trim() && name !== status.name && onUpdate({ name: name.trim() })}
        className="min-w-0 flex-1 border-b border-transparent bg-transparent text-sm font-medium text-neutral-800 outline-none focus:border-purple-300"
      />

      <label className="flex items-center gap-1.5 text-xs text-neutral-500">
        <Switch checked={status.is_default} onChange={(checked) => onUpdate({ is_default: checked })} ariaLabel="Status padrão" />
        Padrão
      </label>

      <button
        type="button"
        onClick={() => setDeleteOpen(true)}
        aria-label="Excluir status"
        className="text-neutral-400 hover:text-red-600"
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
