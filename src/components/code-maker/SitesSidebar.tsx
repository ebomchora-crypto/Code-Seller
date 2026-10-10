import { useState } from 'react'
import { ArrowLeft, ArrowRight, Code2, Download, Loader2, PanelLeftClose, Plus, Settings, SlidersHorizontal, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatRelativeDate } from '@/utils/date'
import type { SiteListItem } from '@/services/supabase/codeMaker'
import { SiteFavicon } from '@/components/code-maker/SiteFavicon'
import { CodeMakerSettings } from '@/components/code-maker/CodeMakerSettings'

interface SitesSidebarProps {
  sites: SiteListItem[]
  activeId: string | null
  loading: boolean
  collapsed: boolean
  onToggleCollapsed: () => void
  onNavigate: () => void
}

/** Quantos sites recentes aparecem na lateral (a lista completa fica na tela inicial do Code Maker). */
const RECENT = 4

function statusLabel(site: SiteListItem): string {
  if (site.status === 'planning' || site.status === 'building') return 'Em criação'
  if (site.status === 'error') return 'Parou no meio'
  return site.published ? 'No ar' : 'Fora do ar'
}

// Pontinho de situação em cima do ícone do site.
function StatusDot({ site }: { site: SiteListItem }) {
  const base = 'absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full ring-2 ring-[var(--panel-bg)]'
  if (site.status === 'planning' || site.status === 'building')
    return (
      <span className={`${base} bg-[var(--accent-solid)] text-white`}>
        <Loader2 className="size-2.5 animate-spin" />
      </span>
    )
  if (site.status === 'error')
    return (
      <span className={`${base} bg-red-500 text-white`}>
        <TriangleAlert className="size-2.5" />
      </span>
    )
  return <span className={`${base} ${site.published ? 'bg-emerald-500' : 'bg-[var(--border-strong)]'}`} />
}

const footerLink =
  'flex h-10 items-center gap-3 rounded-xl px-3 text-[13px] font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]'

// Barra lateral do Code Maker: voltar, "Novo site", os 4 sites mais recentes e, no rodapé,
// o app de Windows e as configurações. A lista completa fica na tela inicial.
export function SitesSidebar({ sites, activeId, loading, collapsed, onToggleCollapsed, onNavigate }: SitesSidebarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  // O site aberto sempre aparece, mesmo que seja mais antigo que os 4 recentes.
  const opened = sites.find((site) => site.id === activeId)
  const recent = sites.slice(0, RECENT)
  if (opened && !recent.some((site) => site.id === opened.id)) recent.splice(RECENT - 1, 1, opened)
  const empty = Math.max(0, RECENT - recent.length)

  return (
    <div data-collapsed={collapsed} className="relative flex h-full w-full flex-col border-r border-[var(--border-subtle)] bg-[var(--panel-bg)] lg:bg-black/[0.015] lg:dark:bg-white/[0.015]">
      <div className={`flex h-16 shrink-0 items-center border-b border-[var(--border-subtle)] ${collapsed ? 'justify-center px-2' : 'gap-2.5 px-4'}`}>
        <button
          type="button"
          onClick={collapsed ? onToggleCollapsed : undefined}
          aria-label={collapsed ? 'Expandir a barra lateral' : undefined}
          title={collapsed ? 'Expandir a barra lateral' : undefined}
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
            aria-label="Recolher a barra lateral"
            title="Recolher a barra lateral"
            className="hidden size-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] lg:flex"
          >
            <PanelLeftClose className="size-4" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1.5 p-3">
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
          className={`flex h-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#8b5cf6,#6d28d9)] text-[13.5px] font-medium text-white shadow-[0_8px_22px_-10px_rgba(124,58,237,0.9)] transition hover:brightness-110 ${collapsed ? 'mx-auto w-10' : 'gap-1.5'}`}
        >
          <Plus className="size-4" strokeWidth={2.4} />
          {!collapsed && 'Novo site'}
        </Link>
      </div>

      {!collapsed && <p className="px-5 pb-1.5 pt-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Recentes</p>}

      <div data-lenis-prevent className="scrollbar-none flex min-h-0 flex-1 flex-col overflow-y-auto px-2 pb-2">
        {loading ? (
          <div className="flex flex-col gap-2 px-1">
            {Array.from({ length: RECENT }, (_, index) => (
              <Skeleton key={index} className="h-[54px] w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <ul className={`flex flex-col gap-1 ${collapsed ? 'items-center' : ''}`}>
            {recent.map((site) => {
              const active = site.id === activeId
              return (
                <li key={site.id} className={collapsed ? '' : 'w-full'}>
                  <Link
                    to={`/code-maker/${site.id}`}
                    onClick={onNavigate}
                    aria-label={site.name}
                    title={collapsed ? `${site.name} · ${statusLabel(site)}` : undefined}
                    className={`flex items-center rounded-xl border transition-colors duration-150 ${collapsed ? 'size-11 justify-center' : 'gap-3 px-2.5 py-2'} ${
                      active ? 'border-[var(--nav-active-border)] shadow-[var(--nav-active-shadow)]' : 'border-transparent hover:bg-[var(--sidebar-item-hover)]'
                    }`}
                    style={active ? { background: 'var(--nav-active-bg)' } : undefined}
                  >
                    <span className="relative shrink-0">
                      <SiteFavicon site={site} size={collapsed ? 30 : 34} />
                      <StatusDot site={site} />
                    </span>
                    {!collapsed && (
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-[13.5px] ${active ? 'font-semibold text-[var(--text-primary)]' : 'font-medium text-[var(--text-secondary)]'}`}>{site.name}</span>
                        <span className="block truncate text-[11.5px] text-[var(--text-muted)]">
                          {statusLabel(site) === 'No ar' ? formatRelativeDate(site.updated_at) : `${statusLabel(site)} · ${formatRelativeDate(site.updated_at)}`}
                        </span>
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
            {!collapsed &&
              Array.from({ length: empty }, (_, index) => (
                <li key={`vazio-${index}`} aria-hidden className="flex items-center gap-3 rounded-xl border border-dashed border-[var(--border-default)] px-2.5 py-2 opacity-60">
                  <span className="size-[34px] shrink-0 rounded-[28%] bg-[var(--bg-muted)]" />
                  <span className="flex-1 space-y-1.5">
                    <span className="block h-2.5 w-24 rounded bg-[var(--bg-muted)]" />
                    <span className="block h-2 w-16 rounded bg-[var(--bg-muted)]" />
                  </span>
                </li>
              ))}
          </ul>
        )}
        {!loading && sites.length === 0 && !collapsed && <p className="px-3 pt-3 text-[12.5px] leading-relaxed text-[var(--text-muted)]">Seus sites aparecem aqui. Descreva o primeiro ao lado.</p>}
        {!loading && sites.length > RECENT && (
          <Link
            to="/code-maker"
            onClick={onNavigate}
            title={collapsed ? `Ver todos os ${sites.length} sites` : undefined}
            aria-label={`Ver todos os ${sites.length} sites`}
            className={`mt-2 flex h-9 items-center rounded-xl text-[12.5px] font-medium text-[var(--accent-text)] transition hover:bg-[var(--accent-tint)] ${collapsed ? 'mx-auto w-10 justify-center' : 'gap-1.5 px-3'}`}
          >
            {collapsed ? <ArrowRight className="size-4" /> : <>Ver todos os {sites.length} sites <ArrowRight className="size-3.5" /></>}
          </Link>
        )}
      </div>

      <nav aria-label="Atalhos" className={`shrink-0 border-t border-[var(--border-subtle)] p-2 ${collapsed ? 'flex flex-col items-center gap-1' : 'flex flex-col gap-0.5'}`}>
        <a
          href="/downloads/CodeSellersIDE-Setup.exe"
          download
          title={collapsed ? 'Baixar a IDE para Windows' : 'Editor de código completo, como o VS Code'}
          aria-label="Baixar IDE no Windows"
          className={collapsed ? 'flex size-10 items-center justify-center rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]' : footerLink}
        >
          <Download className="size-4 shrink-0" />
          {!collapsed && 'Baixar IDE no Windows'}
        </a>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          title={collapsed ? 'Configurações do Code Maker' : undefined}
          aria-label="Configurações do Code Maker"
          className={collapsed ? 'flex size-10 items-center justify-center rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]' : `${footerLink} w-full text-left`}
        >
          <SlidersHorizontal className="size-4 shrink-0" />
          {!collapsed && 'Configurações do Code Maker'}
        </button>
        <Link
          to="/settings"
          title={collapsed ? 'Configurações do usuário' : undefined}
          aria-label="Configurações do usuário"
          className={collapsed ? 'flex size-10 items-center justify-center rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]' : footerLink}
        >
          <Settings className="size-4 shrink-0" />
          {!collapsed && 'Configurações do usuário'}
        </Link>
      </nav>
      <CodeMakerSettings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
