import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

// Abre algo quando a página chega com ?<param>=1 (padrão ?novo=1: atalhos da
// busca rápida e dos primeiros passos) e limpa o parâmetro da URL.
export function useOpenOnParam(open: () => void, param = 'novo') {
  const [searchParams, setSearchParams] = useSearchParams()
  const requested = searchParams.get(param) === '1'

  useEffect(() => {
    if (!requested) return
    open()
    const next = new URLSearchParams(searchParams)
    next.delete(param)
    setSearchParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requested])
}
