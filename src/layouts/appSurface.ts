export interface AppSurface {
  /** Tela que ocupa a altura toda do painel e rola por dentro (chat). */
  immersive: boolean
  animateOpacity: boolean
}

export function getAppSurface(pathname: string): AppSurface {
  // Chat do Copilot e editor do Code Maker (/code-maker/:id).
  const immersive = pathname === '/copilot' || pathname.startsWith('/copilot/') || /^\/code-maker\/[^/]+/.test(pathname)
  return {
    immersive,
    animateOpacity: !immersive,
  }
}
