import { useEffect, useState } from 'react'
import {
  Bell,
  CreditCard,
  GitBranch,
  Plug,
  Settings as SettingsIcon,
  Shield,
  Tags,
  User,
  type LucideIcon,
} from 'lucide-react'

interface SettingsNavItem {
  id: string
  label: string
  icon: LucideIcon
}

const NAV_ITEMS: SettingsNavItem[] = [
  { id: 'perfil', label: 'Perfil', icon: User },
  { id: 'segurança', label: 'Segurança', icon: Shield },
  { id: 'preferências', label: 'Preferências', icon: SettingsIcon },
  { id: 'pipeline', label: 'Pipeline', icon: GitBranch },
  { id: 'crm-status', label: 'Status do CRM', icon: Tags },
  { id: 'integrações', label: 'Integrações', icon: Plug },
  { id: 'plano', label: 'Plano', icon: CreditCard },
  { id: 'notificações', label: 'Notificações', icon: Bell },
]

export function SettingsNav() {
  const [activeId, setActiveId] = useState(NAV_ITEMS[0].id)

  useEffect(() => {
    const sections = NAV_ITEMS.map((item) => document.getElementById(item.id)).filter(
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
      {NAV_ITEMS.map((item) => {
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
    </nav>
  )
}
