import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

// Abre o formulário de criação quando a página chega com ?novo=1 (atalhos da
// busca rápida e dos primeiros passos) e limpa o parâmetro da URL.
export function useOpenOnParam(open: () => void) {
  const [searchParams, setSearchParams] = useSearchParams()
  const requested = searchParams.get('novo') === '1'

  useEffect(() => {
    if (!requested) return
    open()
    const next = new URLSearchParams(searchParams)
    next.delete('novo')
    setSearchParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requested])
}
