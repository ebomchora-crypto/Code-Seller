export interface AppSurface {
  /** Tela que ocupa a altura toda do painel e rola por dentro (chat). */
  immersive: boolean
  animateOpacity: boolean
}

export function getAppSurface(pathname: string): AppSurface {
  const immersive = pathname === '/copilot' || pathname.startsWith('/copilot/')
  return {
    immersive,
    animateOpacity: !immersive,
  }
}
