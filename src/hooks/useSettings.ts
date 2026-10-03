import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAuthContext } from '@/stores/AuthContext'
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
  Integration,
  NotificationPreferences,
  UserProfile,
} from '@/types'

export function useSettings() {
  const { profile, updateProfile: updateAuthProfile, refreshProfile } = useAuthContext()

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences | null>(null)
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [prefs, integrationsList] = await Promise.all([getNotificationPreferences(), getIntegrations()])
      setNotificationPrefs(prefs)
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
    connectIntegration,
    disconnectIntegration,
  }
}
