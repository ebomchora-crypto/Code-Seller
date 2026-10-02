// Mesmos grupos do menu lateral (navConfig.ts).
const PAGE_SECTIONS = [
  { paths: ['/prospection', '/crm'], label: 'Encontrar clientes' },
  { paths: ['/copilot', '/code-maker', '/deals', '/portfolio'], label: 'Vender' },
  { paths: ['/tasks', '/financial', '/relatorios'], label: 'Organizar' },
  { paths: ['/aluno'], label: 'Aprender' },
  { paths: ['/settings', '/support'], label: 'Conta' },
] as const

export function getPageSection(pathname: string): string {
  if (pathname === '/') return 'Principal'

  const section = PAGE_SECTIONS.find(({ paths }) =>
    paths.some((path) => pathname === path || pathname.startsWith(`${path}/`)),
  )

  return section?.label ?? 'Code Sellers'
}
