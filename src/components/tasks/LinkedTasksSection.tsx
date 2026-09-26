import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Card } from '@/components/ui/Card'
import { PanelHeader } from '@/components/ui/PanelHeader'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { TaskCheckbox } from '@/components/tasks/TaskCheckbox'
import { PriorityBadge } from '@/components/tasks/PriorityBadge'
import { StatusBadge } from '@/components/tasks/StatusBadge'
import { DueDateLabel } from '@/components/tasks/DueDateLabel'
import { completeTask, getTasks } from '@/services/supabase/tasks'
import type { Task } from '@/types'

interface LinkedTasksSectionProps {
  contactId?: string
  contactName?: string
  dealId?: string
  dealTitle?: string
}

export function LinkedTasksSection({ contactId, contactName, dealId, dealTitle }: LinkedTasksSectionProps) {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchLinkedTasks() {
    setLoading(true)
    try {
      const result = await getTasks(contactId ? { contact_id: contactId } : { deal_id: dealId })
      setTasks(result)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível carregar as tarefas vinculadas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchLinkedTasks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactId, dealId])

  async function handleComplete(id: string) {
    setTasks((current) => current.map((task) => (task.id === id ? { ...task, status: 'done' } : task)))
    try {
      await completeTask(id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível concluir a tarefa.')
      void fetchLinkedTasks()
    }
  }

  function handleCreateTask() {
    const params = new URLSearchParams()
    if (contactId) params.set('contact_id', contactId)
    if (contactName) params.set('contact_name', contactName)
    if (dealId) params.set('deal_id', dealId)
    if (dealTitle) params.set('deal_title', dealTitle)
    navigate(`/tasks?${params.toString()}`)
  }

  return (
    <Card>
      <PanelHeader title="Tarefas" subtitle={`Vinculadas a ${contactId ? 'este contato' : 'este negócio'}`} />

      {loading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : tasks.length === 0 ? (
        <p className="text-[13.5px] text-[var(--text-muted)]">Nenhuma tarefa vinculada ainda.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-[var(--border-subtle)]">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-center gap-3 py-2.5">
              <TaskCheckbox
                checked={task.status === 'done'}
                onToggle={() => handleComplete(task.id)}
                size="sm"
                ariaLabel={`Concluir ${task.title}`}
              />
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm ${task.status === 'done' ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-primary)]'}`}>
                  {task.title}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <PriorityBadge priority={task.priority} />
                  <StatusBadge status={task.status} />
                  <DueDateLabel due_date={task.due_date} completed_at={task.completed_at} size="sm" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Button variant="secondary" size="sm" className="mt-4 h-9 rounded-full px-4" onClick={handleCreateTask}>
        Criar tarefa para {contactId ? 'este contato' : 'este negócio'}
      </Button>
    </Card>
  )
}
