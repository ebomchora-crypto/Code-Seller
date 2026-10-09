// "Baixar app" na landing: primeiro cria a conta. A escolha fica guardada na
// aba e o download começa assim que a pessoa entra no sistema.
const KEY = 'cs-download-intent'

export type DownloadKind = 'setup' | 'portable' | 'ide'

export const DOWNLOAD_URLS: Record<DownloadKind, string> = {
  setup: '/downloads/CodeSellers-Setup.exe',
  portable: '/downloads/CodeSellers-Portable.exe',
  ide: '/downloads/CodeSellersIDE-Setup.exe',
}

export function rememberDownloadIntent(kind: DownloadKind = 'setup'): void {
  try {
    sessionStorage.setItem(KEY, kind)
  } catch {
    // sem sessionStorage: o botão "Baixar app" do menu continua disponível
  }
}

export function takeDownloadIntent(): DownloadKind | null {
  try {
    const value = sessionStorage.getItem(KEY)
    if (value) sessionStorage.removeItem(KEY)
    return value === 'setup' || value === 'portable' || value === 'ide' ? value : null
  } catch {
    return null
  }
}

export function startDownload(kind: DownloadKind): void {
  const link = document.createElement('a')
  link.href = DOWNLOAD_URLS[kind]
  link.download = ''
  document.body.appendChild(link)
  link.click()
  link.remove()
}
