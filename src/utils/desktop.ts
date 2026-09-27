// Verdadeiro só quando a página roda dentro do app de Windows (Electron).
export function isDesktopApp(): boolean {
  return typeof window !== 'undefined' && Boolean(window.codeSellersDesktop)
}
