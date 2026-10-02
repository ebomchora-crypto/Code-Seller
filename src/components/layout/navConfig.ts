import type { ComponentType, SVGProps } from 'react'
import { ChartColumnBig, CodeXml, Download, GalleryHorizontalEnd, GraduationCap } from 'lucide-react'
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
  /** Explica em poucas palavras para que serve (dica ao passar o mouse e na busca Ctrl+K). */
  hint: string
  /** Link de arquivo (não é uma página do app) — vira <a download> em vez de <Link>. */
  download?: boolean
}

export interface NavGroup {
  label: string
  items: NavItem[]
  /** Grupo de um item só (Início): não precisa de título em cima. */
  hideLabel?: boolean
}

const dashboardItem: NavItem = { label: 'Início', path: '/', icon: DashboardIcon, hint: 'Resumo do dia e das vendas' }
const prospectionItem: NavItem = { label: 'Buyers Hunter', path: '/prospection', icon: ProspectionIcon, hint: 'Achar empresas para abordar' }
const crmItem: NavItem = { label: 'CRM', path: '/crm', icon: CrmIcon, hint: 'Seus contatos e leads' }
const autopilotItem: NavItem = { label: 'CS Copilot', path: '/copilot', icon: AutopilotIcon, hint: 'IA que diz o que responder e quando' }
const codeMakerItem: NavItem = { label: 'Code Maker', path: '/code-maker', icon: CodeXml, hint: 'Criar sites e protótipos com IA' }
const dealsItem: NavItem = { label: 'Negócios', path: '/deals', icon: DealsIcon, hint: 'Funil: do contato ao fechamento' }
const portfolioItem: NavItem = { label: 'Sellers Portfolio', path: '/portfolio', icon: GalleryHorizontalEnd, hint: 'Sua vitrine de trabalhos' }
const tasksItem: NavItem = { label: 'Tarefas', path: '/tasks', icon: TasksIcon, hint: 'Próximos passos e lembretes' }
const financialItem: NavItem = { label: 'Financeiro', path: '/financial', icon: FinancialIcon, hint: 'Entradas, saídas e a receber' }
const reportsItem: NavItem = { label: 'Relatórios', path: '/relatorios', icon: ChartColumnBig, hint: 'Resultados do mês' }
const academyItem: NavItem = { label: 'Área do aluno', path: '/aluno', icon: GraduationCap, hint: 'Lições e biblioteca de vendas' }
const settingsItem: NavItem = { label: 'Configurações', path: '/settings', icon: SettingsIcon, hint: 'Perfil, funil, modelos e conexões' }
const supportItem: NavItem = { label: 'Suporte', path: '/support', icon: SupportIcon, hint: 'Tirar dúvidas e pedir ajuda' }
const downloadAppItem: NavItem = {
  label: 'Baixar app',
  path: '/downloads/CodeSellers-Setup.exe',
  icon: Download,
  hint: 'Code Sellers no Windows',
  download: true,
}

// Os grupos seguem a ordem do trabalho: achar o cliente, vender, organizar.
export const navGroups: NavGroup[] = [
  { label: 'Principal', items: [dashboardItem], hideLabel: true },
  { label: 'Encontrar clientes', items: [prospectionItem, crmItem] },
  { label: 'Vender', items: [autopilotItem, codeMakerItem, dealsItem, portfolioItem] },
  { label: 'Organizar', items: [tasksItem, financialItem, reportsItem] },
  { label: 'Aprender', items: [academyItem] },
  { label: 'Conta', items: [settingsItem, supportItem, downloadAppItem] },
]

export const navItems: NavItem[] = navGroups.flatMap((group) => group.items)

export function getPageTitle(pathname: string): string {
  const match = navItems.find((item) =>
    item.path === '/' ? pathname === '/' : pathname.startsWith(item.path),
  )
  return match?.label ?? 'Code Sellers'
}
