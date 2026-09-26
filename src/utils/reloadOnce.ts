// Depois de um deploy, uma aba antiga (comum no celular) ainda aponta para os
// arquivos da versão anterior, que não existem mais. Recarregar a página
// resolve; a marca no sessionStorage evita um loop de recarregamento.
const RELOAD_KEY = 'code-sellers-chunk-reload'
const RELOAD_WINDOW_MS = 30_000

export function reloadOnce(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0)
    if (Date.now() - last < RELOAD_WINDOW_MS) return false
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
  } catch {
    return false
  }
  window.location.reload()
  return true
}

export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return /dynamically imported module|Importing a module script failed|error loading dynamically|Failed to fetch|MIME type/i.test(message)
}
