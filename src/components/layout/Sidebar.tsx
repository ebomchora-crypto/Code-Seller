import { useLocation } from 'react-router-dom'
import { useAuthContext } from '@/stores/AuthContext'
import { navGroups } from '@/components/layout/navConfig'
import { DashboardSidebar } from '@/components/ui/dashboard-sidebar'

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
}

export function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }: SidebarProps) {
  const { user, profile, signOut } = useAuthContext()
  const { pathname } = useLocation()
  const displayName = profile?.full_name ?? user?.name ?? user?.email

  return (
    <DashboardSidebar
      groups={navGroups}
      collapsed={collapsed}
      currentPath={pathname}
      mobileOpen={mobileOpen}
      displayName={displayName}
      email={user?.email}
      avatarUrl={profile?.avatar_url}
      onToggleCollapse={onToggleCollapse}
      onCloseMobile={onCloseMobile}
      onSignOut={() => void signOut()}
    />
  )
}
