import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Info } from 'lucide-react'
import { Card } from '@/components/ui/Card'
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
    <section id="pipeline" className="scroll-mt-6">
      <Card>
        <span className="label-caps">Negócios</span>
        <h2 className="mt-1 text-2xl font-medium tracking-tightest text-neutral-900">Pipeline</h2>

        <div className="mt-4 flex items-start gap-2 rounded-lg bg-purple-50 px-4 py-3 text-sm text-purple-700">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            As etapas customizadas serão aplicadas a novos negócios. A integração completa com os negócios
            existentes será disponibilizada em breve.
          </p>
        </div>

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
          <Button variant="ghost" size="sm" onClick={onCreate}>
            + Adicionar etapa
          </Button>
        </div>
      </Card>
    </section>
  )
}
