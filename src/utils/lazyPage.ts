import { lazy, type ComponentType } from 'react'
import { isChunkLoadError, reloadOnce } from '@/utils/reloadOnce'

// React.lazy que se recupera de arquivos de uma versão antiga recarregando a página.
export function lazyPage<T extends ComponentType<object>>(load: () => Promise<{ default: T }>) {
  return lazy(() =>
    load().catch((error: unknown) => {
      if (isChunkLoadError(error) && reloadOnce()) return new Promise<never>(() => {})
      throw error
    }),
  )
}
