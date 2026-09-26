import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { GitBranch, Plus } from 'lucide-react'
import { SettingsNote, SettingsSection } from '@/components/settings/SettingsSection'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { StageEditor } from '@/components/settings/StageEditor'
import type { PipelineStage } from '@/types'

interface PipelineSectionProps {
  stages: PipelineStage[]
  onCreate: () => void
  onUpdate: (id: string, data: Partial<PipelineStage>) => void
  onDelete: (id: string) => void
  onReorder: (updates: { id: string; position: number }[]) => void
}

export function PipelineSection({ stages, onCreate, onUpdate, onDelete, onReorder }: PipelineSectionProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))
  const sorted = [...stages].sort((a, b) => a.position - b.position)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = sorted.findIndex((stage) => stage.id === active.id)
    const newIndex = sorted.findIndex((stage) => stage.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = [...sorted]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)
    onReorder(reordered.map((stage, index) => ({ id: stage.id, position: index })))
  }

  return (
    <SettingsSection id="pipeline" icon={GitBranch} title="Etapas do pipeline" description="Nomes, cores e chance padrão de cada etapa. Arraste para reordenar.">
      <SettingsNote>Por enquanto, o pipeline de Negócios ainda usa as etapas padrão. Estas configurações passam a valer quando a personalização for liberada.</SettingsNote>

        <div className="mt-4">
          {sorted.length === 0 ? (
            <EmptyState title="Nenhuma etapa configurada" />
          ) : (
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              <SortableContext items={sorted.map((stage) => stage.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-2">
                  {sorted.map((stage) => (
                    <StageEditor
                      key={stage.id}
                      stage={stage}
                      onUpdate={(data) => onUpdate(stage.id, data)}
                      onDelete={() => onDelete(stage.id)}
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
            Adicionar etapa
          </Button>
        </div>
    </SettingsSection>
  )
}
