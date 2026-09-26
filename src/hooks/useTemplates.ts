import { useCallback, useEffect, useState } from 'react'
import { createTemplate, deleteTemplate, getTemplates, updateTemplate } from '@/services/supabase/templates'
import type { MessageTemplate, TemplateCategory } from '@/types'

export function useTemplates() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      setTemplates(await getTemplates())
      setError(null)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível carregar os modelos.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refetch()
  }, [refetch])

  const create = useCallback(
    async (input: { name: string; category: TemplateCategory; body: string }) => {
      const created = await createTemplate({ ...input, position: templates.length })
      setTemplates((current) => [...current, created])
      return created
    },
    [templates.length],
  )

  const update = useCallback(async (id: string, input: Partial<Pick<MessageTemplate, 'name' | 'category' | 'body'>>) => {
    const updated = await updateTemplate(id, input)
    setTemplates((current) => current.map((template) => (template.id === id ? updated : template)))
  }, [])

  const remove = useCallback(async (id: string) => {
    await deleteTemplate(id)
    setTemplates((current) => current.filter((template) => template.id !== id))
  }, [])

  return { templates, loading, error, refetch, create, update, remove }
}
