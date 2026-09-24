import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAuthContext } from '@/stores/AuthContext'
import {
  createCRMStatus as createCRMStatusService,
  deleteCRMStatus as deleteCRMStatusService,
  getCRMStatuses,
  reorderCRMStatuses as reorderCRMStatusesService,
  updateCRMStatus as updateCRMStatusService,
} from '@/services/supabase/crmStatuses'
import {
  createPipelineStage as createPipelineStageService,
  deletePipelineStage as deletePipelineStageService,
  getPipelineStages,
  reorderPipelineStages as reorderPipelineStagesService,
  updatePipelineStage as updatePipelineStageService,
} from '@/services/supabase/pipelineStages'
import {
  getNotificationPreferences,
  updateNotificationPreferences as updateNotificationPreferencesService,
} from '@/services/supabase/notificationPreferences'
import {
  disconnectIntegration as disconnectIntegrationService,
  getIntegrations,
  updateIntegrationStatus,
} from '@/services/supabase/integrations'
import {
  deleteAvatar as deleteAvatarService,
  deleteCompanyLogo as deleteCompanyLogoService,
  uploadAvatar as uploadAvatarService,
  uploadCompanyLogo as uploadCompanyLogoService,
} from '@/services/supabase/userProfile'
import type {
  CRMStatus,
  Integration,
  NotificationPreferences,
  PipelineStage,
  UserProfile,
} from '@/types'

export function useSettings() {
  const { profile, updateProfile: updateAuthProfile, refreshProfile } = useAuthContext()

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences | null>(null)
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([])
  const [crmStatuses, setCrmStatuses] = useState<CRMStatus[]>([])
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [prefs, stages, statuses, integrationsList] = await Promise.all([
        getNotificationPreferences(),
        getPipelineStages(),
        getCRMStatuses(),
        getIntegrations(),
      ])
      setNotificationPrefs(prefs)
      setPipelineStages(stages)
      setCrmStatuses(statuses)
      setIntegrations(integrationsList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar as configurações.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  const updateProfile = useCallback(
    async (data: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>) => {
      setSaving(true)
      const { error: updateError } = await updateAuthProfile(data)
      setSaving(false)
      if (updateError) {
        toast.error(updateError)
        return false
      }
      toast.success('Perfil atualizado com sucesso.')
      return true
    },
    [updateAuthProfile],
  )

  const uploadAvatar = useCallback(
    async (file: File) => {
      setSaving(true)
      try {
        await uploadAvatarService(file)
        await refreshProfile()
        toast.success('Foto atualizada com sucesso.')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Não foi possível enviar a foto.')
      } finally {
        setSaving(false)
      }
    },
    [refreshProfile],
  )

  const deleteAvatar = useCallback(async () => {
    setSaving(true)
    try {
      await deleteAvatarService()
      await refreshProfile()
      toast.success('Foto removida.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível remover a foto.')
    } finally {
      setSaving(false)
    }
  }, [refreshProfile])

  const uploadCompanyLogo = useCallback(
    async (file: File) => {
      setSaving(true)
      try {
        await uploadCompanyLogoService(file)
        await refreshProfile()
        toast.success('Logo atualizado com sucesso.')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Não foi possível enviar o logo.')
      } finally {
        setSaving(false)
      }
    },
    [refreshProfile],
  )

  const deleteCompanyLogo = useCallback(async () => {
    setSaving(true)
    try {
      await deleteCompanyLogoService()
      await refreshProfile()
      toast.success('Logo removido.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível remover o logo.')
    } finally {
      setSaving(false)
    }
  }, [refreshProfile])

  const updateNotificationPrefs = useCallback(async (data: Partial<NotificationPreferences>) => {
    try {
      const updated = await updateNotificationPreferencesService(data)
      setNotificationPrefs(updated)
      toast.success('Preferências salvas.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível salvar as preferências.')
    }
  }, [])

  const createPipelineStage = useCallback(async (data: Omit<PipelineStage, 'id' | 'user_id' | 'created_at'>) => {
    try {
      const stage = await createPipelineStageService(data)
      setPipelineStages((current) => [...current, stage])
      toast.success('Etapa criada com sucesso.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível criar a etapa.')
    }
  }, [])

  const updatePipelineStage = useCallback(async (id: string, data: Partial<PipelineStage>) => {
    try {
      const updated = await updatePipelineStageService(id, data)
      setPipelineStages((current) => current.map((stage) => (stage.id === id ? updated : stage)))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível atualizar a etapa.')
    }
  }, [])

  const deletePipelineStage = useCallback(async (id: string) => {
    try {
      await deletePipelineStageService(id)
      setPipelineStages((current) => current.filter((stage) => stage.id !== id))
      toast.success('Etapa removida.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível remover a etapa.')
    }
  }, [])

  const reorderPipelineStages = useCallback(async (updates: { id: string; position: number }[]) => {
    const previous = pipelineStages
    setPipelineStages((current) => {
      const byId = new Map(updates.map((update) => [update.id, update.position]))
      return [...current].sort((a, b) => (byId.get(a.id) ?? a.position) - (byId.get(b.id) ?? b.position))
    })
    try {
      await reorderPipelineStagesService(updates)
    } catch (err) {
      setPipelineStages(previous)
      toast.error(err instanceof Error ? err.message : 'Não foi possível reordenar as etapas.')
    }
  }, [pipelineStages])

  const createCRMStatus = useCallback(async (data: Omit<CRMStatus, 'id' | 'user_id' | 'created_at'>) => {
    try {
      const status = await createCRMStatusService(data)
      setCrmStatuses((current) => [...current, status])
      toast.success('Status criado com sucesso.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível criar o status.')
    }
  }, [])

  const updateCRMStatus = useCallback(async (id: string, data: Partial<CRMStatus>) => {
    try {
      const updated = await updateCRMStatusService(id, data)
      setCrmStatuses((current) => current.map((status) => (status.id === id ? updated : status)))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível atualizar o status.')
    }
  }, [])

  const deleteCRMStatus = useCallback(async (id: string) => {
    try {
      await deleteCRMStatusService(id)
      setCrmStatuses((current) => current.filter((status) => status.id !== id))
      toast.success('Status removido.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível remover o status.')
    }
  }, [])

  const reorderCRMStatuses = useCallback(async (updates: { id: string; position: number }[]) => {
    const previous = crmStatuses
    setCrmStatuses((current) => {
      const byId = new Map(updates.map((update) => [update.id, update.position]))
      return [...current].sort((a, b) => (byId.get(a.id) ?? a.position) - (byId.get(b.id) ?? b.position))
    })
    try {
      await reorderCRMStatusesService(updates)
    } catch (err) {
      setCrmStatuses(previous)
      toast.error(err instanceof Error ? err.message : 'Não foi possível reordenar os status.')
    }
  }, [crmStatuses])

  const connectIntegration = useCallback(async (type: Integration['type'], config: Record<string, unknown>) => {
    try {
      const updated = await updateIntegrationStatus(type, 'connected', config)
      setIntegrations((current) => current.map((integration) => (integration.type === type ? updated : integration)))
      toast.success('Integração conectada.')
      return true
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível conectar a integração.')
      return false
    }
  }, [])

  const disconnectIntegration = useCallback(async (type: Integration['type']) => {
    try {
      await disconnectIntegrationService(type)
      setIntegrations((current) =>
        current.map((integration) =>
          integration.type === type ? { ...integration, status: 'disconnected', config: null, connected_at: null } : integration,
        ),
      )
      toast.success('Integração desconectada.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível desconectar a integração.')
    }
  }, [])

  return {
    profile,
    notificationPrefs,
    pipelineStages,
    crmStatuses,
    integrations,
    loading,
    saving,
    error,
    refetch: loadAll,
    updateProfile,
    uploadAvatar,
    deleteAvatar,
    uploadCompanyLogo,
    deleteCompanyLogo,
    updateNotificationPrefs,
    createPipelineStage,
    updatePipelineStage,
    deletePipelineStage,
    reorderPipelineStages,
    createCRMStatus,
    updateCRMStatus,
    deleteCRMStatus,
    reorderCRMStatuses,
    connectIntegration,
    disconnectIntegration,
  }
}
