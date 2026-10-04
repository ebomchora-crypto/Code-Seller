import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { isOutdated, loadedEntry, publishedEntry } from '@/utils/appVersion'

const CHECK_EVERY_MS = 5 * 60 * 1000
const MIN_GAP_MS = 60 * 1000

// Atualiza o Code Sellers sozinho quando sai uma versão nova: ao trocar de
// tela já abre a versão nova; parado numa tela, mostra o aviso "Atualizar".
export function AppUpdater() {
  const { pathname } = useLocation()
  const [ready, setReady] = useState(false)
  const lastCheck = useRef(0)
  const firstPath = useRef(pathname)
  const loaded = useRef<string | null>(null)

  const check = useCallback(async () => {
    if (!import.meta.env.PROD || ready) return
    const now = Date.now()
    if (now - lastCheck.current < MIN_GAP_MS) return
    lastCheck.current = now
    loaded.current ??= loadedEntry()
    try {
      if (isOutdated(loaded.current, await publishedEntry())) setReady(true)
    } catch {
      // sem internet: confere na próxima vez
    }
  }, [ready])

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') void check() }
    const timer = window.setInterval(() => void check(), CHECK_EVERY_MS)
    window.addEventListener('focus', onVisible)
    document.addEventListener('visibilitychange', onVisible)
    void check()
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', onVisible)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [check])

  // Trocou de tela com versão nova esperando: carrega a tela já na versão nova.
  useEffect(() => {
    if (pathname === firstPath.current) return
    firstPath.current = pathname
    if (ready) window.location.reload()
    else void check()
  }, [pathname, ready, check])

  if (!ready) return null
  return (
    <div role="status" className="fixed inset-x-0 bottom-4 z-[100] flex justify-center px-4">
      <div className="flex items-center gap-3 rounded-full border border-[var(--border-default)] bg-[var(--bg-card)] py-2 pl-4 pr-2 text-[13px] text-[var(--text-secondary)] shadow-[0_12px_40px_-12px_rgba(0,0,0,0.6)]">
        <span>Saiu uma versão nova do Code Sellers.</span>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-1.5 rounded-full bg-[linear-gradient(135deg,#8b5cf6,#6d28d9)] px-3 py-1.5 font-semibold text-white"
        >
          <RefreshCw className="size-3.5" /> Atualizar
        </button>
      </div>
    </div>
  )
}
