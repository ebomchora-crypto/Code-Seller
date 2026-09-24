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
    <nav className="flex gap-1 overflow-x-auto lg:sticky lg:top-6 lg:flex-col lg:overflow-visible">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const active = activeId === item.id
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => handleClick(item.id)}
            className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-150 lg:border-l-2 ${
              active
                ? 'bg-purple-50 font-medium text-purple-700 lg:border-purple-600'
                : 'text-neutral-500 hover:bg-neutral-50 lg:border-transparent'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
