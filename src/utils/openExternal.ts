// Abre um link fora do Code Sellers: no navegador padrão quando estiver no app
// de Windows, numa nova aba no navegador.
export function openExternal(url: string): void {
  if (window.codeSellersDesktop) window.codeSellersDesktop.openInBrowser(url)
  else window.open(url, '_blank', 'noopener,noreferrer')
}
