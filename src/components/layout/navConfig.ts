import type { ComponentType, SVGProps } from 'react'
import { ChartColumnBig, GalleryHorizontalEnd } from 'lucide-react'
import {
  AutopilotIcon,
  CrmIcon,
  DashboardIcon,
  DealsIcon,
  FinancialIcon,
  ProspectionIcon,
  SettingsIcon,
  SupportIcon,
  TasksIcon,
} from '@/components/layout/navIcons'

export interface NavItem {
  label: string
  path: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

const dashboardItem: NavItem = { label: 'Início', path: '/', icon: DashboardIcon }
const prospectionItem: NavItem = { label: 'Buyers Hunter', path: '/prospection', icon: ProspectionIcon }
const crmItem: NavItem = { label: 'CRM', path: '/crm', icon: CrmIcon }
const portfolioItem: NavItem = { label: 'Sellers Portfolio', path: '/portfolio', icon: GalleryHorizontalEnd }
const dealsItem: NavItem = { label: 'Negócios', path: '/deals', icon: DealsIcon }
const financialItem: NavItem = { label: 'Financeiro', path: '/financial', icon: FinancialIcon }
const tasksItem: NavItem = { label: 'Tarefas', path: '/tasks', icon: TasksIcon }
const reportsItem: NavItem = { label: 'Relatórios', path: '/relatorios', icon: ChartColumnBig }
const autopilotItem: NavItem = { label: 'CS Copilot', path: '/copilot', icon: AutopilotIcon }
const settingsItem: NavItem = { label: 'Configurações', path: '/settings', icon: SettingsIcon }
const supportItem: NavItem = { label: 'Suporte', path: '/support', icon: SupportIcon }

export const navGroups: NavGroup[] = [
  { label: 'Principal', items: [dashboardItem] },
  { label: 'Vendas', items: [prospectionItem, crmItem, portfolioItem, dealsItem] },
  { label: 'Gestão', items: [financialItem, tasksItem, reportsItem] },
  { label: 'IA', items: [autopilotItem] },
  { label: 'Conta', items: [settingsItem, supportItem] },
]

export const navItems: NavItem[] = navGroups.flatMap((group) => group.items)

export function getPageTitle(pathname: string): string {
  const match = navItems.find((item) =>
    item.path === '/' ? pathname === '/' : pathname.startsWith(item.path),
  )
  return match?.label ?? 'Code Sellers'
}
