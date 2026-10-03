import { lazy, type ComponentType } from 'react'
import { reloadOnce } from '@/utils/reloadOnce'

// React.lazy que se recupera quando o arquivo da tela não carrega (versão
// antiga depois de um deploy, ou cópia com defeito guardada no navegador):
// rebaixa os arquivos e recarrega a página uma vez.
export function lazyPage<T extends ComponentType<object>>(load: () => Promise<{ default: T }>) {
  return lazy(() =>
    load().catch((error: unknown) => {
      if (reloadOnce()) return new Promise<never>(() => {})
      throw error
    }),
  )
}
