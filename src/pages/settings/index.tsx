import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { PageHeader, PageWrapper } from '@/components/ui/PageWrapper'
import { SettingsNav } from '@/components/settings/SettingsNav'
import { ProfileSection } from '@/components/settings/ProfileSection'
import { PlanSection } from '@/components/settings/PlanSection'
import { SecuritySection } from '@/components/settings/SecuritySection'
import { PreferencesSection } from '@/components/settings/PreferencesSection'
import { IntegrationsSection } from '@/components/settings/IntegrationsSection'
import { CalendarFeedSection } from '@/components/settings/CalendarFeedSection'
import { NotificationsSection } from '@/components/settings/NotificationsSection'
import { TemplatesSection } from '@/components/settings/TemplatesSection'
import { FollowUpSection } from '@/components/settings/FollowUpSection'
import { DesktopAppSection } from '@/components/settings/DesktopAppSection'
import { isDesktopApp } from '@/utils/desktop'
import { useSettings } from '@/hooks/useSettings'
import { useAuthContext } from '@/stores/AuthContext'

// Título de cada grupo de seções (os mesmos grupos do menu da esquerda).
function GroupTitle({ children, first = false }: { children: string; first?: boolean }) {
  return (
    <h2 className={`text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)] ${first ? '' : 'mt-4'}`}>
      {children}
    </h2>
  )
}

export default function SettingsPage() {
  const { user } = useAuthContext()
  const {
    profile,
    notificationPrefs,
    integrations,
    loading,
    saving,
    updateProfile,
    uploadAvatar,
    deleteAvatar,
    uploadCompanyLogo,
    deleteCompanyLogo,
    updateNotificationPrefs,
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

  return (
    <PageWrapper>
        <PageHeader title="Configurações" subtitle="Seu perfil, sua conta e como o Code Sellers funciona para você." />

        <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          <div className="lg:sticky lg:top-6 lg:w-60 lg:shrink-0">
            <SettingsNav />
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-6">
            <GroupTitle first>Sua conta</GroupTitle>

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

            <PlanSection />

            <SecuritySection />

            <PreferencesSection profile={profile} onSave={updateProfile} saving={saving} />

            <NotificationsSection preferences={notificationPrefs} loading={loading} onSave={updateNotificationPrefs} />

            {isDesktopApp() && <DesktopAppSection />}

            <GroupTitle>Como você vende</GroupTitle>

            <TemplatesSection />

            <FollowUpSection />

            <GroupTitle>Conexões</GroupTitle>

            <IntegrationsSection
              integrations={integrations}
              onConnect={connectIntegration}
              onDisconnect={disconnectIntegration}
            />

            <CalendarFeedSection />
          </div>
        </div>
    </PageWrapper>
  )
}
