import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Info } from 'lucide-react'
import { Card } from '@/components/ui/Card'
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
    <section id="crm-status" className="scroll-mt-6">
      <Card>
        <span className="label-caps">CRM</span>
        <h2 className="mt-1 text-2xl font-medium tracking-tightest text-neutral-900">Status do CRM</h2>

        <div className="mt-4 flex items-start gap-2 rounded-lg bg-purple-50 px-4 py-3 text-sm text-purple-700">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Os status customizados serão aplicados a novos contatos. A integração completa com os contatos
            existentes será disponibilizada em breve.
          </p>
        </div>

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
          <Button variant="ghost" size="sm" onClick={onCreate}>
            + Adicionar status
          </Button>
        </div>
      </Card>
    </section>
  )
}
