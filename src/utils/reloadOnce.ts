// Depois de um deploy, uma aba antiga (comum no celular) ainda aponta para os
// arquivos da versão anterior, que não existem mais. Recarregar a página
// resolve; a marca no sessionStorage evita um loop de recarregamento.
const RELOAD_KEY = 'code-sellers-chunk-reload'
const RELOAD_WINDOW_MS = 30_000
const REFRESH_TIMEOUT_MS = 8_000

// Um arquivo do site guardado com defeito no navegador (download cortado)
// continua quebrado mesmo recarregando, porque fica guardado por um ano.
// Baixa de novo, ignorando o que está guardado, todos os arquivos do site.
async function refreshSiteFiles(): Promise<void> {
  const html = await (await fetch('/', { cache: 'no-store' })).text()
  const entry = html.match(/\/assets\/[^"']+\.js/)?.[0]
  if (!entry) return
  const main = await (await fetch(entry, { cache: 'reload' })).text()
  const folder = entry.slice(0, entry.lastIndexOf('/') + 1)
  const names = new Set(main.match(/[\w.-]+-[\w-]{8}\.(?:js|css)/g) ?? [])
  await Promise.all([...names].map((name) => fetch(folder + name, { cache: 'reload' }).catch(() => undefined)))
}

// Rebaixa os arquivos (no máximo alguns segundos) e recarrega a página.
export function repairAndReload(): void {
  const timeout = new Promise((resolve) => window.setTimeout(resolve, REFRESH_TIMEOUT_MS))
  void Promise.race([refreshSiteFiles().catch(() => undefined), timeout]).finally(() => window.location.reload())
}

export function reloadOnce(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0)
    if (Date.now() - last < RELOAD_WINDOW_MS) return false
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
  } catch {
    return false
  }
  repairAndReload()
  return true
}

export function isChunkLoadError(error: unknown): boolean {
  if (error instanceof SyntaxError) return true
  const message = error instanceof Error ? error.message : String(error)
  return /dynamically imported module|Importing a module script failed|error loading dynamically|Failed to fetch|MIME type|Invalid or unexpected token|Unexpected end of input/i.test(
    message,
  )
}
