import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getDealById, updateDeal as updateDealService } from '@/services/supabase/deals'
import { createActivity, deleteActivity as deleteActivityService } from '@/services/supabase/dealActivities'
import {
  deleteProposal as deleteProposalService,
  uploadProposal as uploadProposalService,
} from '@/services/supabase/proposals'
import { generateProposal as generateProposalIntegration } from '@/integrations/anthropic'
import type { Deal, DealActivity, ProposalGenerationPayload } from '@/types'

export function useDeal(id: string | undefined) {
  const [deal, setDeal] = useState<Deal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploadingProposal, setUploadingProposal] = useState(false)
  const [generatingProposal, setGeneratingProposal] = useState(false)

  const fetchDeal = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const result = await getDealById(id)
      setDeal(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar o negócio.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void fetchDeal()
  }, [fetchDeal])

  const updateDeal = useCallback(
    async (data: Partial<Deal>) => {
      if (!id) return false
      try {
        const updated = await updateDealService(id, data)
        setDeal((current) => (current ? { ...current, ...updated } : updated))
        toast.success('Negócio atualizado com sucesso.')
        return true
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Não foi possível atualizar o negócio.')
        return false
      }
    },
    [id],
  )

  const addActivity = useCallback(
    async (data: Omit<DealActivity, 'id' | 'user_id' | 'created_at' | 'deal_id'>) => {
      if (!id) return
      try {
        const activity = await createActivity({ ...data, deal_id: id })
        setDeal((current) =>
          current ? { ...current, activities: [activity, ...(current.activities ?? [])] } : current,
        )
        toast.success('Atividade registrada.')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Não foi possível registrar a atividade.')
      }
    },
    [id],
  )

  const deleteActivity = useCallback(async (activityId: string) => {
    try {
      await deleteActivityService(activityId)
      setDeal((current) =>
        current ? { ...current, activities: current.activities?.filter((item) => item.id !== activityId) } : current,
      )
      toast.success('Atividade removida.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível remover a atividade.')
    }
  }, [])

  const uploadProposal = useCallback(
    async (file: File) => {
      if (!id) return
      setUploadingProposal(true)
      try {
        const path = await uploadProposalService(id, file)
        setDeal((current) => (current ? { ...current, proposal_url: path } : current))
        toast.success('Proposta anexada com sucesso.')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Não foi possível anexar a proposta.')
      } finally {
        setUploadingProposal(false)
      }
    },
    [id],
  )

  const deleteProposal = useCallback(async () => {
    if (!id || !deal?.proposal_url) return
    try {
      await deleteProposalService(id, deal.proposal_url)
      setDeal((current) => (current ? { ...current, proposal_url: null } : current))
      toast.success('Proposta removida.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível remover a proposta.')
    }
  }, [id, deal?.proposal_url])

  const generateProposal = useCallback(async (payload: ProposalGenerationPayload) => {
    setGeneratingProposal(true)
    try {
      return await generateProposalIntegration(payload)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível gerar a proposta.')
      return null
    } finally {
      setGeneratingProposal(false)
    }
  }, [])

  return {
    deal,
    loading,
    error,
    refetch: fetchDeal,
    updateDeal,
    addActivity,
    deleteActivity,
    uploadProposal,
    uploadingProposal,
    deleteProposal,
    generateProposal,
    generatingProposal,
  }
}
