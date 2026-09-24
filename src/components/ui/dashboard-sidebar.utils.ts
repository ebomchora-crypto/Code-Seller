export function isSidebarRouteActive(itemPath: string, pathname: string): boolean {
  if (itemPath === '/') return pathname === '/'
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`)
}
