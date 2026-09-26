import { useLocation } from 'react-router-dom'
import { Bell, Moon, Sun } from 'lucide-react'
import { Tooltip } from '@/components/ui/Tooltip'
import { getPageTitle } from '@/components/layout/navConfig'
import { getPageSection } from '@/components/layout/pageMeta'
import { MenuIcon } from '@/components/layout/navIcons'

interface HeaderProps {
  onOpenMobileMenu: () => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

const iconButton =
  'flex size-10 items-center justify-center rounded-full border border-[var(--panel-border)] bg-[var(--bg-card)] text-[var(--text-secondary)] transition-all duration-200 hover:border-[var(--accent-ring)] hover:text-[var(--accent-text)]'

export function Header({ onOpenMobileMenu, theme, onToggleTheme }: HeaderProps) {
  const { pathname } = useLocation()
  const title = getPageTitle(pathname)
  const section = getPageSection(pathname)

  return (
    <header className="flex h-[72px] shrink-0 items-center justify-between gap-4 border-b border-[var(--panel-border)] px-5 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Abrir menu"
          className="flex size-10 items-center justify-center rounded-full border border-[var(--panel-border)] text-[var(--text-secondary)] lg:hidden"
        >
          <MenuIcon className="size-5" />
        </button>
        <nav aria-label="Você está em" className="flex min-w-0 items-center gap-2 text-[14px]">
          <span className="hidden text-[var(--text-muted)] sm:inline">{section}</span>
          <span className="hidden text-[var(--text-muted)] sm:inline" aria-hidden>
            /
          </span>
          <span className="truncate font-semibold text-[var(--text-primary)]">{title}</span>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <Tooltip content="Alternar tema">
          <button type="button" onClick={onToggleTheme} aria-label="Alternar tema" className={iconButton}>
            <span className="relative flex size-4 items-center justify-center">
              <Sun
                className={`absolute size-4 transition-all duration-300 ${theme === 'dark' ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`}
              />
              <Moon
                className={`absolute size-4 transition-all duration-300 ${theme === 'dark' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`}
              />
            </span>
          </button>
        </Tooltip>

        {/* Notificações — placeholder visual por agora, sem lógica ainda. */}
        <button type="button" aria-label="Notificações" className={iconButton}>
          <Bell className="size-4" />
        </button>
      </div>
    </header>
  )
}
