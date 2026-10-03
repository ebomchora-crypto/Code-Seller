import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'
import { isChunkLoadError } from '@/utils/reloadOnce'

interface State {
  error: Error | null
}

// Nunca deixa a tela em branco: se algo quebrar, mostra o aviso com "Recarregar".
export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    const outdated = isChunkLoadError(error)
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[var(--bg-primary)] px-6 text-center">
        <div className="max-w-sm">
          <h1 className="font-display text-[22px] font-semibold tracking-tight text-[var(--text-primary)]">
            {outdated ? 'Temos uma versão nova' : 'Algo deu errado'}
          </h1>
          <p className="mt-2 text-[14.5px] text-[var(--text-muted)]">
            {outdated ? 'Recarregue para abrir a versão mais recente do Code Sellers.' : 'Recarregue a página para continuar. Seus dados estão salvos.'}
          </p>
          {!outdated && error.message && (
            <p className="mt-4 break-words rounded-xl bg-black/[0.04] px-3 py-2 font-mono text-[11px] text-[var(--text-muted)] dark:bg-white/[0.04]">
              Detalhe para o suporte: {error.message.slice(0, 200)}
            </p>
          )}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-[linear-gradient(135deg,#8b5cf6,#6d28d9)] px-6 text-sm font-semibold text-white"
          >
            <RefreshCw className="size-4" />
            Recarregar
          </button>
        </div>
      </div>
    )
  }
}
