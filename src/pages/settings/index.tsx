import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { PageHeader, PageWrapper } from '@/components/ui/PageWrapper'
import { SettingsNav } from '@/components/settings/SettingsNav'
import { ProfileSection } from '@/components/settings/ProfileSection'
import { SecuritySection } from '@/components/settings/SecuritySection'
import { PreferencesSection } from '@/components/settings/PreferencesSection'
import { PipelineSection } from '@/components/settings/PipelineSection'
import { CRMStatusSection } from '@/components/settings/CRMStatusSection'
import { IntegrationsSection } from '@/components/settings/IntegrationsSection'
import { NotificationsSection } from '@/components/settings/NotificationsSection'
import { TemplatesSection } from '@/components/settings/TemplatesSection'
import { FollowUpSection } from '@/components/settings/FollowUpSection'
import { useSettings } from '@/hooks/useSettings'
import { useAuthContext } from '@/stores/AuthContext'
import { CATEGORY_COLOR_SWATCHES } from '@/types'

export default function SettingsPage() {
  const { user } = useAuthContext()
  const {
    profile,
    notificationPrefs,
    pipelineStages,
    crmStatuses,
    integrations,
    loading,
    saving,
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
  } = useSettings()
  const location = useLocation()

  // Links como /settings#notificações abrem já na seção certa.
  useEffect(() => {
    if (!location.hash || loading) return
    const id = decodeURIComponent(location.hash.slice(1))
    const timer = window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150)
    return () => window.clearTimeout(timer)
  }, [location.hash, loading])

  function handleCreatePipelineStage() {
    void createPipelineStage({
      name: 'Nova etapa',
      color: CATEGORY_COLOR_SWATCHES[pipelineStages.length % CATEGORY_COLOR_SWATCHES.length],
      position: pipelineStages.length,
      default_probability: 0,
      is_won: false,
      is_lost: false,
    })
  }

  function handleCreateCRMStatus() {
    void createCRMStatus({
      name: 'Novo status',
      color: CATEGORY_COLOR_SWATCHES[crmStatuses.length % CATEGORY_COLOR_SWATCHES.length],
      position: crmStatuses.length,
      is_default: false,
    })
  }

  return (
    <PageWrapper>
        <PageHeader title="Configurações" subtitle="Seu perfil, sua conta e como o Code Sellers funciona para você." />

        <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          <div className="lg:sticky lg:top-6 lg:w-60 lg:shrink-0">
            <SettingsNav />
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-6">
            <ProfileSection
              profile={profile}
              userEmail={user?.email ?? ''}
              onSave={updateProfile}
              onUploadAvatar={uploadAvatar}
              onDeleteAvatar={deleteAvatar}
              onUploadLogo={uploadCompanyLogo}
              onDeleteLogo={deleteCompanyLogo}
              saving={saving}
            />

            <SecuritySection />

            <PreferencesSection profile={profile} onSave={updateProfile} saving={saving} />

            <PipelineSection
              stages={pipelineStages}
              onCreate={handleCreatePipelineStage}
              onUpdate={updatePipelineStage}
              onDelete={deletePipelineStage}
              onReorder={reorderPipelineStages}
            />

            <CRMStatusSection
              statuses={crmStatuses}
              onCreate={handleCreateCRMStatus}
              onUpdate={updateCRMStatus}
              onDelete={deleteCRMStatus}
              onReorder={reorderCRMStatuses}
            />

            <IntegrationsSection
              integrations={integrations}
              onConnect={connectIntegration}
              onDisconnect={disconnectIntegration}
            />

            <TemplatesSection />

            <FollowUpSection />

            <NotificationsSection preferences={notificationPrefs} loading={loading} onSave={updateNotificationPrefs} />
          </div>
        </div>
    </PageWrapper>
  )
}
