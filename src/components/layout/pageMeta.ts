const PAGE_SECTIONS = [
  { paths: ['/prospection', '/crm', '/deals'], label: 'Vendas' },
  { paths: ['/financial', '/tasks'], label: 'Gestão' },
  { paths: ['/copilot'], label: 'IA' },
  { paths: ['/settings', '/support'], label: 'Conta' },
] as const

export function getPageSection(pathname: string): string {
  if (pathname === '/') return 'Principal'

  const section = PAGE_SECTIONS.find(({ paths }) =>
    paths.some((path) => pathname === path || pathname.startsWith(`${path}/`)),
  )

  return section?.label ?? 'Code Sellers'
}
