import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { createTag as createTagService, deleteTag as deleteTagService, getTags } from '@/services/supabase/tags'
import type { Tag } from '@/types'

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTags = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getTags()
      setTags(result)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível carregar as tags.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchTags()
  }, [fetchTags])

  const createTag = useCallback(async (name: string, color: string) => {
    try {
      const tag = await createTagService(name, color)
      setTags((current) => [...current, tag].sort((a, b) => a.name.localeCompare(b.name)))
      return tag
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível criar a tag.')
      return null
    }
  }, [])

  const deleteTag = useCallback(async (id: string) => {
    try {
      await deleteTagService(id)
      setTags((current) => current.filter((tag) => tag.id !== id))
      toast.success('Tag removida.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível remover a tag.')
    }
  }, [])

  return { tags, loading, createTag, deleteTag, refetch: fetchTags }
}
