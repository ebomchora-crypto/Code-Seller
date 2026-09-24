export interface AppSurface {
  dark: boolean
  animateOpacity: boolean
}

export function getAppSurface(pathname: string): AppSurface {
  const dark = pathname === '/autopilot' || pathname.startsWith('/autopilot/')
  return {
    dark,
    animateOpacity: !dark,
  }
}
