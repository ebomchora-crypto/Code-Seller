import { ArrowLeft, Code2, Globe, Loader2, PanelLeftClose, Plus, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatRelativeDate } from '@/utils/date'
import type { SiteListItem } from '@/services/supabase/codeMaker'

interface SitesSidebarProps {
  sites: SiteListItem[]
  activeId: string | null
  loading: boolean
  collapsed: boolean
  onToggleCollapsed: () => void
  onNavigate: () => void
}

function StatusIcon({ site, active }: { site: SiteListItem; active: boolean }) {
  if (site.status === 'planning' || site.status === 'building') return <Loader2 className="size-4 shrink-0 animate-spin text-[var(--accent-text)]" />
  if (site.status === 'error') return <TriangleAlert className="size-4 shrink-0 text-red-500" />
  if (site.published) return <Globe className="size-4 shrink-0 text-emerald-500" />
  return <Code2 className={`size-4 shrink-0 ${active ? 'text-[var(--accent-text)]' : 'text-[var(--text-muted)]'}`} />
}

function statusLabel(site: SiteListItem): string {
  if (site.status === 'planning' || site.status === 'building') return 'Em criação'
  if (site.status === 'error') return 'Parou no meio'
  return site.published ? 'No ar' : 'Fora do ar'
}

// Barra lateral do Code Maker, no mesmo formato da barra de conversas do CS
// Copilot: voltar ao sistema, "Novo site" e a lista dos sites.
export function SitesSidebar({ sites, activeId, loading, collapsed, onToggleCollapsed, onNavigate }: SitesSidebarProps) {
  return (
    <div data-collapsed={collapsed} className="relative flex h-full w-full flex-col border-r border-[var(--border-subtle)] bg-[var(--panel-bg)] lg:bg-black/[0.015] lg:dark:bg-white/[0.015]">
      <div className={`flex h-16 shrink-0 items-center border-b border-[var(--border-subtle)] ${collapsed ? 'justify-center px-2' : 'gap-2.5 px-4'}`}>
        <button
          type="button"
          onClick={collapsed ? onToggleCollapsed : undefined}
          aria-label={collapsed ? 'Expandir lista de sites' : undefined}
          title={collapsed ? 'Expandir lista de sites' : undefined}
          className={collapsed ? 'flex size-10 items-center justify-center rounded-full hover:bg-[var(--bg-muted)]' : 'pointer-events-none'}
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#8b5cf6,#5b21b6)] text-white shadow-[0_8px_20px_-10px_rgba(124,58,237,0.9)]">
            <Code2 className="size-4.5" />
          </span>
        </button>
        {!collapsed && (
          <span className="min-w-0 flex-1">
            <span className="block font-display text-[14.5px] font-semibold leading-tight text-[var(--text-primary)]">Code Maker</span>
            <span className="block text-[11.5px] leading-tight text-[var(--text-muted)]">Sites feitos com IA</span>
          </span>
        )}
        {!collapsed && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label="Recolher lista de sites"
            title="Recolher lista de sites"
            className="hidden size-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] lg:flex"
          >
            <PanelLeftClose className="size-4" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1 p-3">
        <Link
          to="/"
          title={collapsed ? 'Voltar ao Code Sellers' : undefined}
          aria-label="Voltar ao Code Sellers"
          className={`flex h-9 items-center rounded-full text-[13px] font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] ${collapsed ? 'mx-auto w-10 justify-center' : 'gap-2 px-3'}`}
        >
          <ArrowLeft className="size-4" />
          {!collapsed && 'Voltar ao Code Sellers'}
        </Link>
        <Link
          to="/code-maker"
          onClick={onNavigate}
          aria-label="Novo site"
          title={collapsed ? 'Novo site' : undefined}
          className={`flex h-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#8b5cf6,#6d28d9)] text-[13.5px] font-medium text-white shadow-[0_8px_22px_-10px_rgba(124,58,237,0.9)] transition hover:brightness-110 ${collapsed ? 'mx-auto w-10' : 'w-full gap-2'}`}
        >
          <Plus className="size-4" strokeWidth={2.4} />
          {!collapsed && 'Novo site'}
        </Link>
      </div>

      {!collapsed && <p className="px-5 pb-1.5 pt-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Seus sites</p>}

      <div data-lenis-prevent className="scrollbar-none flex-1 overflow-y-auto px-2 pb-3">
        {loading ? (
          <div className="flex flex-col gap-2 px-2">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ) : sites.length === 0 && !collapsed ? (
          <p className="px-3 py-3 text-[13px] leading-relaxed text-[var(--text-muted)]">Nenhum site ainda. Descreva o primeiro ao lado.</p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {sites.map((site) => {
              const active = site.id === activeId
              if (collapsed) {
                return (
                  <li key={site.id} className="flex justify-center">
                    <Link
                      to={`/code-maker/${site.id}`}
                      onClick={onNavigate}
                      aria-label={site.name}
                      title={site.name}
                      className={`flex size-10 items-center justify-center rounded-lg border transition-colors ${active ? 'border-[var(--nav-active-border)] bg-[var(--nav-active-bg)]' : 'border-transparent hover:bg-[var(--sidebar-item-hover)]'}`}
                    >
                      <StatusIcon site={site} active={active} />
                    </Link>
                  </li>
                )
              }
              return (
                <li key={site.id}>
                  <Link
                    to={`/code-maker/${site.id}`}
                    onClick={onNavigate}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-colors duration-150 ${
                      active ? 'border-[var(--nav-active-border)] shadow-[var(--nav-active-shadow)]' : 'border-transparent hover:bg-[var(--sidebar-item-hover)]'
                    }`}
                    style={active ? { background: 'var(--nav-active-bg)' } : undefined}
                  >
                    <StatusIcon site={site} active={active} />
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-[13.5px] ${active ? 'font-semibold text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>{site.name}</span>
                      <span className="block truncate text-[11.5px] text-[var(--text-muted)]">
                        {statusLabel(site)} · {formatRelativeDate(site.updated_at)}
                      </span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
