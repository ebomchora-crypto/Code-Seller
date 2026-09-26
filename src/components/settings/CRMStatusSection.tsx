import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Tags, Plus } from 'lucide-react'
import { SettingsNote, SettingsSection } from '@/components/settings/SettingsSection'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusEditor } from '@/components/settings/StatusEditor'
import type { CRMStatus } from '@/types'

interface CRMStatusSectionProps {
  statuses: CRMStatus[]
  onCreate: () => void
  onUpdate: (id: string, data: Partial<CRMStatus>) => void
  onDelete: (id: string) => void
  onReorder: (updates: { id: string; position: number }[]) => void
}

export function CRMStatusSection({ statuses, onCreate, onUpdate, onDelete, onReorder }: CRMStatusSectionProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))
  const sorted = [...statuses].sort((a, b) => a.position - b.position)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = sorted.findIndex((status) => status.id === active.id)
    const newIndex = sorted.findIndex((status) => status.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = [...sorted]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)
    onReorder(reordered.map((status, index) => ({ id: status.id, position: index })))
  }

  return (
    <SettingsSection id="crm-status" icon={Tags} title="Status do CRM" description="Os estágios dos seus contatos. Arraste para reordenar.">
      <SettingsNote>Por enquanto, o CRM ainda usa os status padrão. Estas configurações passam a valer quando a personalização for liberada.</SettingsNote>

        <div className="mt-4">
          {sorted.length === 0 ? (
            <EmptyState title="Nenhum status configurado" />
          ) : (
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              <SortableContext items={sorted.map((status) => status.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-2">
                  {sorted.map((status) => (
                    <StatusEditor
                      key={status.id}
                      status={status}
                      onUpdate={(data) => onUpdate(status.id, data)}
                      onDelete={() => onDelete(status.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        <div className="mt-4">
          <Button variant="secondary" size="sm" className="h-9 rounded-full px-4" onClick={onCreate}>
            <Plus className="size-4" />
            Adicionar status
          </Button>
        </div>
    </SettingsSection>
  )
}
