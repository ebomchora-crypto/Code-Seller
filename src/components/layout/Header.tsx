import { useLocation } from 'react-router-dom'
import { Bell, Moon, Sun } from 'lucide-react'
import { useAuthContext } from '@/stores/AuthContext'
import { Tooltip } from '@/components/ui/Tooltip'
import { Eyebrow } from '@/components/ui/eyebrow'
import { getPageTitle } from '@/components/layout/navConfig'
import { getPageSection } from '@/components/layout/pageMeta'
import { MenuIcon } from '@/components/layout/navIcons'

interface HeaderProps {
  onOpenMobileMenu: () => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

function initialsFromUser(name?: string, email?: string): string {
  if (name) return name.slice(0, 2).toUpperCase()
  if (email) return email.slice(0, 2).toUpperCase()
  return 'CS'
}

export function Header({ onOpenMobileMenu, theme, onToggleTheme }: HeaderProps) {
  const { pathname } = useLocation()
  const { user, profile } = useAuthContext()
  const title = getPageTitle(pathname)
  const section = getPageSection(pathname)

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/80 px-6 backdrop-blur-md transition-colors duration-300">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Abrir menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-muted)] lg:hidden"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <div>
          <Eyebrow>{section}</Eyebrow>
          <h1 className="mt-0.5 font-display text-xl font-bold leading-none tracking-tight text-[var(--text-primary)]">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Tooltip content="Alternar tema">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Alternar tema"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] text-[var(--text-secondary)] transition-all duration-200 hover:bg-[var(--purple-soft)] hover:text-purple-500"
          >
            <span className="relative flex h-4 w-4 items-center justify-center">
              <Sun
                className={`absolute h-4 w-4 transition-all duration-300 ${theme === 'dark' ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`}
              />
              <Moon
                className={`absolute h-4 w-4 transition-all duration-300 ${theme === 'dark' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`}
              />
            </span>
          </button>
        </Tooltip>

        {/* Notificações — placeholder visual por agora, sem lógica ainda. */}
        <button
          type="button"
          aria-label="Notificações"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] text-[var(--text-secondary)] transition-all duration-200 hover:bg-[var(--purple-soft)] hover:text-purple-500"
        >
          <Bell className="h-4 w-4" />
        </button>

        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/15 text-xs font-medium text-purple-500">
            {initialsFromUser(profile?.full_name ?? user?.name, user?.email)}
          </div>
        )}
      </div>
    </header>
  )
}
