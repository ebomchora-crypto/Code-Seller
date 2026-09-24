import { LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import type { NavGroup } from '@/components/layout/navConfig'
import { cn } from '@/lib/utils'
import { EASE_PREMIUM } from '@/utils/animations'
import { isSidebarRouteActive } from './dashboard-sidebar.utils'

export interface DashboardSidebarProps {
  groups: NavGroup[]
  collapsed: boolean
  currentPath: string
  mobileOpen: boolean
  displayName?: string
  email?: string
  avatarUrl?: string | null
  onToggleCollapse: () => void
  onCloseMobile: () => void
  onSignOut: () => void
}

function initialsFromUser(name?: string, email?: string): string {
  const source = name?.trim() || email?.trim() || 'Code Sellers'
  const words = source.split(/\s+/).filter(Boolean)

  if (words.length > 1) return `${words[0][0]}${words[1][0]}`.toUpperCase()
  return source.slice(0, 2).toUpperCase()
}

export function DashboardSidebar({
  groups,
  collapsed,
  currentPath,
  mobileOpen,
  displayName,
  email,
  avatarUrl,
  onToggleCollapse,
  onCloseMobile,
  onSignOut,
}: DashboardSidebarProps) {
  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={onCloseMobile}
          className="fixed inset-0 z-30 bg-accent-ink/40 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex h-full flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] font-sans shadow-[1px_0_0_rgba(11,0,20,0.02)] transition-[width,transform] duration-300 ease-out lg:static lg:translate-x-0',
          collapsed ? 'w-[76px]' : 'w-[260px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className={cn('flex h-[72px] shrink-0 items-center p-3', collapsed ? 'justify-center' : 'justify-between')}>
          <div className={cn('flex min-w-0 items-center', collapsed ? 'justify-center' : 'gap-3 px-2')}>
            <img
              src="/logo.png"
              alt="Code Sellers"
              className="h-8 w-8 shrink-0 rounded-[7px] object-cover shadow-[0_6px_18px_rgba(95,0,178,0.22)]"
            />
            {!collapsed && (
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-display text-[14px] font-bold leading-none tracking-tight text-[var(--text-primary)]">
                  Code Sellers
                </span>
                <span className="mt-1 truncate text-[10px] uppercase leading-none tracking-[0.14em] text-[var(--text-muted)]">
                  CRM para vendedores
                </span>
              </span>
            )}
          </div>

          {!collapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="Recolher menu"
              className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--text-primary)] lg:flex"
            >
              <PanelLeftClose className="h-[17px] w-[17px]" strokeWidth={1.5} />
            </button>
          )}
        </div>

        {collapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Expandir menu"
            className="mx-auto hidden h-8 w-8 items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--text-primary)] lg:flex"
          >
            <PanelLeftOpen className="h-[17px] w-[17px]" strokeWidth={1.5} />
          </button>
        )}

        <nav className={cn('scrollbar-none flex flex-1 flex-col overflow-y-auto px-3 pb-4', collapsed ? 'mt-3 gap-4' : 'mt-1 gap-5')}>
          {groups.map((group) => (
            <section key={group.label} className="flex flex-col gap-0.5" aria-label={group.label}>
              {!collapsed && (
                <p className="mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]/70">
                  {group.label}
                </p>
              )}

              {group.items.map((item) => {
                const isActive = isSidebarRouteActive(item.path, currentPath)

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    title={collapsed ? item.label : undefined}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={onCloseMobile}
                    className={cn(
                      'group relative flex h-9 items-center rounded-[7px] text-[13px] tracking-[0.01em] transition-colors duration-150',
                      collapsed ? 'justify-center px-0' : 'gap-2.5 px-2.5',
                      isActive
                        ? 'bg-accent-soft/55 font-semibold text-accent-700 dark:bg-white/[0.08] dark:text-accent-bright'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--text-primary)]',
                    )}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="dashboard-sidebar-active"
                        className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-accent"
                        transition={{ duration: 0.3, ease: EASE_PREMIUM }}
                      />
                    )}
                    <item.icon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-colors',
                        isActive ? 'text-accent dark:text-accent-bright' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]',
                      )}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                )
              })}
            </section>
          ))}
        </nav>

        <div className="shrink-0 border-t border-[var(--sidebar-border)] p-3">
          <div className={cn('flex items-center rounded-lg py-1', collapsed ? 'flex-col gap-2' : 'gap-2.5 px-1')}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-accent/15" />
            ) : (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent-700 ring-1 ring-accent/10">
                {initialsFromUser(displayName, email)}
              </span>
            )}

            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium leading-tight text-[var(--text-primary)]">{displayName || 'Usuário'}</p>
                <p className="mt-0.5 truncate text-[11px] leading-tight text-[var(--text-muted)]">{email}</p>
              </div>
            )}

            <button
              type="button"
              onClick={onSignOut}
              title="Sair"
              aria-label="Sair"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-red-500/10 hover:text-red-500"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
