import { useEffect, useRef, useState } from 'react'
import { SITE_SANDBOX } from '@/components/code-maker/SitePreview'

// Miniatura do site: o próprio site em 1280px, reduzido. Só carrega quando
// o cartão aparece na tela.
export function SiteThumbnail({ html, title }: { html: string | null; title: string }) {
  const box = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [scale, setScale] = useState(0.25)

  useEffect(() => {
    const element = box.current
    if (!element) return
    const resize = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / 1280))
    resize.observe(element)
    const seen = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true)
        seen.disconnect()
      }
    })
    seen.observe(element)
    return () => {
      resize.disconnect()
      seen.disconnect()
    }
  }, [])

  return (
    <div ref={box} className="relative aspect-[16/10] overflow-hidden bg-[var(--bg-muted)]">
      {html && visible ? (
        <iframe
          title={`Miniatura de ${title}`}
          sandbox={SITE_SANDBOX}
          srcDoc={html}
          tabIndex={-1}
          aria-hidden
          loading="lazy"
          className="pointer-events-none absolute left-0 top-0 origin-top-left border-0 bg-white"
          style={{ width: 1280, height: 800, transform: `scale(${scale})` }}
        />
      ) : (
        <div className="absolute inset-0 animate-pulse bg-[linear-gradient(120deg,transparent,rgba(139,92,246,0.08),transparent)]" />
      )}
    </div>
  )
}
