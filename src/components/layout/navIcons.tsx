import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function baseProps(props: IconProps): IconProps {
  return {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    ...props,
  }
}

export function DashboardIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  )
}

export function ProspectionIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

export function CrmIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

export function DealsIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}

export function FinancialIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect x="2" y="6" width="20" height="13" rx="2" />
      <path d="M2 10h20M7 15h3" />
    </svg>
  )
}

export function TasksIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="m9 12 2 2 4-4" />
      <rect x="3" y="4" width="18" height="17" rx="2" />
    </svg>
  )
}

export function AutopilotIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
      <circle cx="12" cy="12" r="5" />
    </svg>
  )
}

export function SettingsIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.36a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.64 15a1.7 1.7 0 0 0-1.56-1.04H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.64 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.64a1.7 1.7 0 0 0 1.04-1.56V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15 4.64a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.36 9a1.7 1.7 0 0 0 1.56 1.04H21a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15z" />
    </svg>
  )
}

export function SupportIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.29c-.8.35-1 .96-1 1.71M12 17h.01" />
    </svg>
  )
}

export function LogoutIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5M21 12H9" />
    </svg>
  )
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}
