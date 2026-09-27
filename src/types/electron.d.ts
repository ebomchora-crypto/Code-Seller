// Ponte exposta pelo preload do app de Windows (desktop/preload.js). Só
// existe quando a tela roda dentro do Electron — em qualquer navegador
// normal, window.codeSellersDesktop é undefined. O site é carregado ao vivo,
// então versões antigas do app podem não ter todas as funções: por isso as
// mais novas são opcionais e precisam ser checadas antes do uso.
export {}

declare global {
  interface CodeSellersDesktopNotification {
    title: string
    body?: string
    /** Tela do app aberta ao clicar no aviso (ex.: /tasks?task=123). */
    path?: string
  }

  interface Window {
    codeSellersDesktop?: {
      openInBrowser: (url: string) => void
      notify?: (notification: CodeSellersDesktopNotification) => void
      setTaskbarBadge?: (count: number, imageDataUrl: string | null) => void
      getOpenAtLogin?: () => Promise<boolean>
      setOpenAtLogin?: (enabled: boolean) => Promise<boolean>
      onNavigate?: (callback: (path: string) => void) => () => void
    }
    __codeSellersVerifyHandoff?: (tokenHash: string) => Promise<void>
  }
}
