import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  addTagToTask,
  completeTask as completeTaskService,
  createSubtask as createSubtaskService,
  deleteSubtask as deleteSubtaskService,
  getTaskById,
  removeTagFromTask,
  reopenTask as reopenTaskService,
  updateSubtask as updateSubtaskService,
  updateTask as updateTaskService,
} from '@/services/supabase/tasks'
import type { Tag, Task } from '@/types'

export function useTask(id: string | undefined) {
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTask = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const result = await getTaskById(id)
      setTask(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar a tarefa.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void fetchTask()
  }, [fetchTask])

  const updateTask = useCallback(
    async (data: Partial<Task>) => {
      if (!id) return
      try {
        const updated = await updateTaskService(id, data)
        setTask((current) => (current ? { ...current, ...updated } : updated))
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Não foi possível atualizar a tarefa.')
      }
    },
    [id],
  )

  const completeTask = useCallback(async () => {
    if (!id) return
    try {
      const updated = await completeTaskService(id)
      setTask((current) => (current ? { ...current, ...updated } : updated))
      toast.success('Tarefa concluída.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível concluir a tarefa.')
    }
  }, [id])

  const reopenTask = useCallback(async () => {
    if (!id) return
    try {
      const updated = await reopenTaskService(id)
      setTask((current) => (current ? { ...current, ...updated } : updated))
      toast.success('Tarefa reaberta.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível reabrir a tarefa.')
    }
  }, [id])

  const createSubtask = useCallback(
    async (title: string) => {
      if (!id) return
      if ((task?.subtasks?.length ?? 0) >= 20) {
        toast.error('Limite de 20 subtarefas por tarefa atingido.')
        return
      }
      try {
        const subtask = await createSubtaskService(id, title)
        setTask((current) => (current ? { ...current, subtasks: [...(current.subtasks ?? []), subtask] } : current))
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Não foi possível adicionar a subtarefa.')
      }
    },
    [id, task?.subtasks?.length],
  )

  const updateSubtask = useCallback(async (subtaskId: string, data: Pick<Task, 'title' | 'status'>) => {
    try {
      const updated = await updateSubtaskService(subtaskId, data)
      setTask((current) =>
        current
          ? { ...current, subtasks: current.subtasks?.map((subtask) => (subtask.id === subtaskId ? updated : subtask)) }
          : current,
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível atualizar a subtarefa.')
    }
  }, [])

  const deleteSubtask = useCallback(async (subtaskId: string) => {
    try {
      await deleteSubtaskService(subtaskId)
      setTask((current) =>
        current ? { ...current, subtasks: current.subtasks?.filter((subtask) => subtask.id !== subtaskId) } : current,
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível remover a subtarefa.')
    }
  }, [])

  const addTag = useCallback(
    async (tag: Tag) => {
      if (!id) return
      try {
        await addTagToTask(id, tag.id)
        setTask((current) => (current ? { ...current, tags: [...(current.tags ?? []), tag] } : current))
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Não foi possível adicionar a tag.')
      }
    },
    [id],
  )

  const removeTag = useCallback(
    async (tagId: string) => {
      if (!id) return
      try {
        await removeTagFromTask(id, tagId)
        setTask((current) => (current ? { ...current, tags: current.tags?.filter((tag) => tag.id !== tagId) } : current))
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Não foi possível remover a tag.')
      }
    },
    [id],
  )

  return {
    task,
    loading,
    error,
    refetch: fetchTask,
    updateTask,
    completeTask,
    reopenTask,
    createSubtask,
    updateSubtask,
    deleteSubtask,
    addTag,
    removeTag,
  }
}
