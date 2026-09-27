// Ponte exposta pelo preload do app de Windows (desktop/preload.js). Só
// existe quando a tela roda dentro do Electron — em qualquer navegador
// normal, window.codeSellersDesktop é undefined.
export {}

declare global {
  interface Window {
    codeSellersDesktop?: {
      openInBrowser: (url: string) => void
    }
    __codeSellersSetSession?: (tokens: { access_token: string; refresh_token: string }) => void
  }
}
