import { useEffect, useRef, useState } from 'react'
import { frameDocument } from '@/utils/codeMakerStream'

// O site gerado roda isolado: pode ter scripts, mas não acessa o painel,
// a sessão nem nada do Code Sellers.
export const SITE_SANDBOX =
  'allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-top-navigation-by-user-activation'

interface SitePreviewProps {
  html: string | null
  title: string
  className?: string
}

// Prévia sem piscar: o documento novo carrega num quadro escondido e só
// troca de lugar com o atual quando está pronto, na mesma posição de rolagem.
export function SitePreview({ html, title, className = '' }: SitePreviewProps) {
  const [docs, setDocs] = useState<[string | null, string | null]>([null, null])
  const [active, setActive] = useState<0 | 1>(0)
  const frames = [useRef<HTMLIFrameElement>(null), useRef<HTMLIFrameElement>(null)]
  const scrollY = useRef(0)
  const activeRef = useRef<0 | 1>(0)
  const waiting = useRef<0 | 1 | null>(null)

  // Guarda a rolagem do quadro visível.
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const visible = frames[activeRef.current].current
      if (!visible || event.source !== visible.contentWindow) return
      const y = (event.data as { codeMakerScroll?: unknown } | null)?.codeMakerScroll
      if (typeof y === 'number') scrollY.current = y
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!html) return
    const doc = frameDocument(html, { scrollY: scrollY.current })
    const current = activeRef.current
    // Primeiro documento: mostra direto.
    if (docs[current] === null) {
      setDocs((state) => (current === 0 ? [doc, state[1]] : [state[0], doc]))
      return
    }
    const next: 0 | 1 = current === 0 ? 1 : 0
    waiting.current = next
    setDocs((state) => (next === 0 ? [doc, state[1]] : [state[0], doc]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html])

  function handleLoad(index: 0 | 1) {
    if (waiting.current !== index) return
    waiting.current = null
    // Tempo para o Tailwind aplicar os estilos antes de mostrar.
    window.setTimeout(() => {
      activeRef.current = index
      setActive(index)
    }, 180)
  }

  return (
    <div className={`relative overflow-hidden bg-white ${className}`}>
      {([0, 1] as const).map((index) =>
        docs[index] === null ? null : (
          <iframe
            key={index}
            ref={frames[index]}
            title={index === active ? title : `${title} (carregando)`}
            sandbox={SITE_SANDBOX}
            srcDoc={docs[index] ?? undefined}
            onLoad={() => handleLoad(index)}
            aria-hidden={index !== active}
            tabIndex={index === active ? 0 : -1}
            className={`absolute inset-0 h-full w-full border-0 bg-white transition-opacity duration-200 ${
              index === active ? 'z-10 opacity-100' : 'pointer-events-none z-0 opacity-0'
            }`}
          />
        ),
      )}
    </div>
  )
}
