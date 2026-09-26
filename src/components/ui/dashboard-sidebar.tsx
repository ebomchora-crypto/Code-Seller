import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowUpRight, ChevronDown, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import type { NavGroup } from '@/components/layout/navConfig'
import { SilkRibbons } from '@/components/auth/SilkRibbons'
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

// Card do CS Copilot no rodapé do menu: mesmo tecido roxo das telas de acesso,
// liga o app à identidade visual e leva pro módulo de IA.
function CopilotCard({ onNavigate }: { onNavigate: () => void }) {
  return (
    <Link
      to="/copilot"
      onClick={onNavigate}
      className="group relative mb-3 block overflow-hidden rounded-[18px] p-4 text-white shadow-[0_18px_40px_-22px_rgba(91,33,182,0.9)] ring-1 ring-white/10"
    >
      <SilkRibbons className="absolute inset-0 h-full w-full transition-transform duration-700 ease-out group-hover:scale-110" />
      <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,6,13,0.15),rgba(8,6,13,0.75))]" />
      <span className="relative flex items-start justify-between gap-2">
        <span>
          <span className="block text-[13px] font-semibold leading-tight">CS Copilot</span>
          <span className="mt-1 block text-[11.5px] leading-snug text-white/75">
            Propostas, follow-ups e mensagens escritos pela IA.
          </span>
        </span>
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/15 backdrop-blur-md transition group-hover:bg-white/25">
          <ArrowUpRight className="size-3.5" />
        </span>
      </span>
    </Link>
  )
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
  const navRef = useRef<HTMLElement>(null)
  const [canScrollDown, setCanScrollDown] = useState(false)

  const updateScrollHint = useCallback(() => {
    const nav = navRef.current
    if (!nav) return
    setCanScrollDown(nav.scrollHeight - nav.scrollTop - nav.clientHeight > 4)
  }, [])

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const observer = new ResizeObserver(updateScrollHint)
    observer.observe(nav)
    return () => observer.disconnect()
  }, [updateScrollHint, collapsed])

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={onCloseMobile}
          className="fixed inset-0 z-30 bg-[#08060d]/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex h-full flex-col bg-[var(--shell-bg)] font-sans transition-[width,transform] duration-300 ease-out lg:static lg:translate-x-0',
          collapsed ? 'w-[84px]' : 'w-[264px]',
          mobileOpen ? 'translate-x-0 shadow-[var(--shadow-modal)]' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className={cn('flex h-[76px] shrink-0 items-center px-4', collapsed ? 'justify-center' : 'justify-between')}>
          <Link to="/" onClick={onCloseMobile} className={cn('flex min-w-0 items-center', !collapsed && 'gap-3 px-1')}>
            <img
              src="/logo.png"
              alt="Code Sellers"
              className="size-9 shrink-0 rounded-[11px] object-cover shadow-[0_8px_22px_-6px_rgba(124,58,237,0.7)] ring-1 ring-white/10"
            />
            {!collapsed && (
              <span className="truncate font-display text-[15px] font-bold tracking-tight text-[var(--text-primary)]">
                Code Sellers
              </span>
            )}
          </Link>

          {!collapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="Recolher menu"
              className="hidden size-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--text-primary)] lg:flex"
            >
              <PanelLeftClose className="size-[17px]" strokeWidth={1.6} />
            </button>
          )}
        </div>

        {collapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Expandir menu"
            className="mx-auto hidden size-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--text-primary)] lg:flex"
          >
            <PanelLeftOpen className="size-[17px]" strokeWidth={1.6} />
          </button>
        )}

        <div className="relative flex min-h-0 flex-1 flex-col">
        <nav
          ref={navRef}
          onScroll={updateScrollHint}
          data-lenis-prevent
          className={cn(
            'scrollbar-none flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pb-4',
            collapsed ? 'mt-3 gap-3' : 'mt-2 gap-6 [@media(max-height:780px)]:gap-3',
          )}
        >
          {groups.map((group) => (
            <section key={group.label} className="flex flex-col gap-1" aria-label={group.label}>
              {!collapsed && (
                <p className="mb-1 px-3 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)] [@media(max-height:780px)]:mb-0">
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
                      'group relative flex h-10 items-center rounded-xl text-[13.5px] transition-colors duration-150 [@media(max-height:780px)]:h-9',
                      collapsed ? 'mx-auto w-10 justify-center' : 'gap-3 px-3',
                      isActive
                        ? 'font-semibold text-[var(--text-primary)]'
                        : 'font-medium text-[var(--text-secondary)] hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--text-primary)]',
                    )}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="dashboard-sidebar-active"
                        className="absolute inset-0 rounded-xl border border-[var(--nav-active-border)] shadow-[var(--nav-active-shadow)]"
                        style={{ background: 'var(--nav-active-bg)' }}
                        transition={{ duration: 0.35, ease: EASE_PREMIUM }}
                      />
                    )}
                    <item.icon
                      className={cn(
                        'relative size-[18px] shrink-0 transition-colors',
                        isActive ? 'text-[var(--accent-text)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]',
                      )}
                    />
                    {!collapsed && <span className="relative truncate">{item.label}</span>}
                  </Link>
                )
              })}
            </section>
          ))}
        </nav>
          {/* Em telas baixas o menu rola: o degradê avisa que tem mais embaixo. */}
          <div
            aria-hidden
            className={cn(
              'pointer-events-none absolute inset-x-0 bottom-0 flex h-12 items-end justify-center bg-gradient-to-t from-[var(--shell-bg)] to-transparent pb-1 transition-opacity duration-200',
              canScrollDown ? 'opacity-100' : 'opacity-0',
            )}
          >
            <ChevronDown className="size-4 animate-bounce text-[var(--text-muted)]" />
          </div>
        </div>

        <div className="shrink-0 px-3 pb-3">
          {/* Em telas baixas (notebooks) o card some pra não esconder o menu. */}
          {!collapsed && !isSidebarRouteActive('/copilot', currentPath) && (
            <div className="[@media(max-height:860px)]:hidden">
              <CopilotCard onNavigate={onCloseMobile} />
            </div>
          )}

          <div
            className={cn(
              'flex items-center rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)] p-2',
              collapsed ? 'flex-col gap-2' : 'gap-2.5',
            )}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="size-9 shrink-0 rounded-xl object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#8b5cf6,#5b21b6)] text-[12px] font-semibold text-white">
                {initialsFromUser(displayName, email)}
              </span>
            )}

            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold leading-tight text-[var(--text-primary)]">{displayName || 'Usuário'}</p>
                <p className="mt-0.5 truncate text-[11.5px] leading-tight text-[var(--text-muted)]">{email}</p>
              </div>
            )}

            <button
              type="button"
              onClick={onSignOut}
              title="Sair"
              aria-label="Sair"
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut className="size-4" strokeWidth={1.6} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
