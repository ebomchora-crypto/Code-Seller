import { useEffect, useState } from 'react'
import {
  Bell,
  CalendarDays,
  MessageSquareText,
  Monitor,
  Repeat,
  Plug,
  Settings as SettingsIcon,
  Shield,
  User,
  type LucideIcon,
} from 'lucide-react'

import { isDesktopApp } from '@/utils/desktop'

interface SettingsNavItem {
  id: string
  label: string
  icon: LucideIcon
  /** Só aparece dentro do app de Windows. */
  desktopOnly?: boolean
}

// Mesma ordem e mesmos grupos das seções da página (pages/settings).
const SETTINGS_GROUPS: { label: string; items: SettingsNavItem[] }[] = [
  {
    label: 'Sua conta',
    items: [
      { id: 'perfil', label: 'Perfil', icon: User },
      { id: 'segurança', label: 'Segurança', icon: Shield },
      { id: 'preferências', label: 'Preferências', icon: SettingsIcon },
      { id: 'notificações', label: 'Notificações', icon: Bell },
      { id: 'app-windows', label: 'App de Windows', icon: Monitor, desktopOnly: true },
    ],
  },
  {
    label: 'Como você vende',
    items: [
      { id: 'modelos', label: 'Mensagens prontas', icon: MessageSquareText },
      { id: 'follow-up', label: 'Follow-up automático', icon: Repeat },
    ],
  },
  {
    label: 'Conexões',
    items: [
      { id: 'integrações', label: 'Integrações', icon: Plug },
      { id: 'agenda', label: 'Google Agenda', icon: CalendarDays },
    ],
  },
]

const VISIBLE_GROUPS = SETTINGS_GROUPS.map((group) => ({
  ...group,
  items: group.items.filter((item) => !item.desktopOnly || isDesktopApp()),
}))
const VISIBLE_ITEMS = VISIBLE_GROUPS.flatMap((group) => group.items)

export function SettingsNav() {
  const [activeId, setActiveId] = useState(VISIBLE_ITEMS[0].id)

  useEffect(() => {
    const sections = VISIBLE_ITEMS.map((item) => document.getElementById(item.id)).filter(
      (element): element is HTMLElement => element !== null,
    )

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting)
        if (visible.length > 0) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: '-10% 0px -70% 0px', threshold: 0 },
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  function handleClick(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <nav
      aria-label="Seções das configurações"
      className="scrollbar-none -mx-1 flex gap-1.5 overflow-x-auto px-1 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:rounded-[var(--card-radius)] lg:border lg:border-[var(--border-subtle)] lg:bg-[var(--bg-card)] lg:p-2 lg:shadow-[var(--shadow-card)]"
    >
      {VISIBLE_GROUPS.map((group, index) => (
        <div key={group.label} className="contents lg:flex lg:flex-col lg:gap-1">
          <p
            className={`hidden px-3 pb-1 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)] lg:block ${index > 0 ? 'lg:mt-3' : 'lg:mt-1'}`}
          >
            {group.label}
          </p>
          {group.items.map((item) => {
            const Icon = item.icon
            const active = activeId === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleClick(item.id)}
                aria-current={active ? 'true' : undefined}
                className={`flex h-9 shrink-0 items-center gap-2.5 rounded-full border px-3.5 text-[13.5px] transition-all duration-150 lg:h-10 lg:rounded-xl lg:px-3 ${
                  active
                    ? 'border-[var(--nav-active-border)] font-semibold text-[var(--text-primary)] shadow-[var(--nav-active-shadow)]'
                    : 'border-[var(--border-default)] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] lg:border-transparent lg:hover:bg-[var(--sidebar-item-hover)]'
                }`}
                style={active ? { background: 'var(--nav-active-bg)' } : undefined}
              >
                <Icon className={`size-4 shrink-0 ${active ? 'text-[var(--accent-text)]' : 'text-[var(--text-muted)]'}`} />
                {item.label}
              </button>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
