import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  completeTask as completeTaskService,
  deleteTask as deleteTaskService,
  getTasks,
  reorderTasks as reorderTasksService,
  updateTaskStatus as updateTaskStatusService,
} from '@/services/supabase/tasks'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import type { Task, TaskFilters, TaskStatus, TasksView } from '@/types'

const DEFAULT_FILTERS: TaskFilters = {
  search: '',
  status: 'all',
  priority: 'all',
  contact_id: '',
  deal_id: '',
  tag_id: '',
  due: 'all',
}

const KANBAN_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done', 'cancelled']

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS)
  const [view, setView] = useState<TasksView>('list')

  const debouncedSearch = useDebouncedValue(filters.search, 300)
  const effectiveFilters = useMemo(() => ({ ...filters, search: debouncedSearch }), [filters, debouncedSearch])

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getTasks(effectiveFilters)
      setTasks(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar as tarefas.')
    } finally {
      setLoading(false)
    }
  }, [effectiveFilters])

  useEffect(() => {
    void fetchTasks()
  }, [fetchTasks])

  const updateFilters = useCallback((next: Partial<TaskFilters>) => {
    setFilters((current) => ({ ...current, ...next }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
  }, [])

  const hasActiveFilters =
    filters.search !== '' ||
    filters.status !== 'all' ||
    filters.priority !== 'all' ||
    filters.contact_id !== '' ||
    filters.deal_id !== '' ||
    filters.tag_id !== '' ||
    filters.due !== 'all'

  const completeTask = useCallback(async (id: string) => {
    const previous = tasks.find((task) => task.id === id)
    if (!previous) return

    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, status: 'done', completed_at: new Date().toISOString() } : task)),
    )

    try {
      await completeTaskService(id)
      toast.success('Tarefa concluída.')
    } catch (err) {
      setTasks((current) => current.map((task) => (task.id === id ? previous : task)))
      toast.error(err instanceof Error ? err.message : 'Não foi possível concluir a tarefa.')
    }
  }, [tasks])

  const removeTask = useCallback(async (id: string) => {
    try {
      await deleteTaskService(id)
      setTasks((current) => current.filter((task) => task.id !== id))
      toast.success('Tarefa excluída com sucesso.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível excluir a tarefa.')
    }
  }, [])

  const updateStatus = useCallback(
    async (id: string, status: TaskStatus) => {
      const previous = tasks.find((task) => task.id === id)
      if (!previous) return

      const columnTasks = tasks.filter((task) => task.status === status && task.id !== id)
      const position = columnTasks.length

      setTasks((current) =>
        current.map((task) =>
          task.id === id
            ? { ...task, status, position, completed_at: status === 'done' ? new Date().toISOString() : task.completed_at }
            : task,
        ),
      )

      try {
        await updateTaskStatusService(id, status, position)
      } catch (err) {
        setTasks((current) => current.map((task) => (task.id === id ? previous : task)))
        toast.error(err instanceof Error ? err.message : 'Não foi possível atualizar o status.')
      }
    },
    [tasks],
  )

  const reorder = useCallback(
    async (orderedIds: string[]) => {
      const previous = tasks
      setTasks((current) =>
        current.map((task) => {
          const newIndex = orderedIds.indexOf(task.id)
          return newIndex === -1 ? task : { ...task, position: newIndex }
        }),
      )

      try {
        await reorderTasksService(orderedIds.map((id, index) => ({ id, position: index })))
      } catch (err) {
        setTasks(previous)
        toast.error(err instanceof Error ? err.message : 'Não foi possível reordenar as tarefas.')
      }
    },
    [tasks],
  )

  const tasksByStatus = useMemo(() => {
    const grouped = new Map<TaskStatus, Task[]>()
    for (const status of KANBAN_STATUSES) grouped.set(status, [])
    for (const task of tasks) {
      grouped.get(task.status)?.push(task)
    }
    for (const list of grouped.values()) {
      list.sort((a, b) => a.position - b.position)
    }
    return grouped
  }, [tasks])

  return {
    tasks,
    tasksByStatus,
    loading,
    error,
    filters,
    setFilters: updateFilters,
    clearFilters,
    hasActiveFilters,
    view,
    setView,
    refetch: fetchTasks,
    completeTask,
    deleteTask: removeTask,
    updateStatus,
    reorder,
  }
}
