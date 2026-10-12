export interface AppSurface {
  /** Tela que ocupa a altura toda do painel e rola por dentro (chat). */
  immersive: boolean
  animateOpacity: boolean
}

export function getAppSurface(pathname: string): AppSurface {
  // CS Copilot e Code Maker ocupam a altura toda do painel e rolam por dentro.
  const immersive = isKeepAlivePath(pathname)
  return {
    immersive,
    animateOpacity: !immersive,
  }
}

/** Telas que ficam abertas por baixo (sem recarregar) quando você troca de ferramenta. */
export function isCopilotPath(pathname: string): boolean {
  return pathname === '/copilot' || pathname.startsWith('/copilot/')
}

export function isCodeMakerPath(pathname: string): boolean {
  return pathname === '/code-maker' || pathname.startsWith('/code-maker/')
}

export function isKeepAlivePath(pathname: string): boolean {
  return isCopilotPath(pathname) || isCodeMakerPath(pathname)
}
