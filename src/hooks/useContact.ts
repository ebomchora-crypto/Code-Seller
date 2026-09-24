import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getContactById, updateContact as updateContactService } from '@/services/supabase/contacts'
import {
  createInteraction as createInteractionService,
  deleteInteraction as deleteInteractionService,
} from '@/services/supabase/interactions'
import { addTagToContact, removeTagFromContact } from '@/services/supabase/tags'
import type { Contact, Interaction, Tag } from '@/types'

export function useContact(id: string | undefined) {
  const [contact, setContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchContact = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const result = await getContactById(id)
      setContact(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar o contato.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void fetchContact()
  }, [fetchContact])

  const updateContact = useCallback(
    async (data: Partial<Contact>) => {
      if (!id) return
      try {
        const updated = await updateContactService(id, data)
        setContact((current) => (current ? { ...current, ...updated } : updated))
        toast.success('Contato atualizado com sucesso.')
        return true
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Não foi possível atualizar o contato.')
        return false
      }
    },
    [id],
  )

  const addInteraction = useCallback(
    async (data: Omit<Interaction, 'id' | 'user_id' | 'created_at' | 'contact_id'>) => {
      if (!id) return
      try {
        const interaction = await createInteractionService({ ...data, contact_id: id })
        setContact((current) =>
          current ? { ...current, interactions: [interaction, ...(current.interactions ?? [])] } : current,
        )
        toast.success('Interação registrada.')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Não foi possível registrar a interação.')
      }
    },
    [id],
  )

  const deleteInteraction = useCallback(async (interactionId: string) => {
    try {
      await deleteInteractionService(interactionId)
      setContact((current) =>
        current
          ? { ...current, interactions: current.interactions?.filter((item) => item.id !== interactionId) }
          : current,
      )
      toast.success('Interação removida.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível remover a interação.')
    }
  }, [])

  const addTag = useCallback(
    async (tag: Tag) => {
      if (!id) return
      try {
        await addTagToContact(id, tag.id)
        setContact((current) => (current ? { ...current, tags: [...(current.tags ?? []), tag] } : current))
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
        await removeTagFromContact(id, tagId)
        setContact((current) =>
          current ? { ...current, tags: current.tags?.filter((tag) => tag.id !== tagId) } : current,
        )
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Não foi possível remover a tag.')
      }
    },
    [id],
  )

  return {
    contact,
    loading,
    error,
    refetch: fetchContact,
    updateContact,
    addInteraction,
    deleteInteraction,
    addTag,
    removeTag,
  }
}
