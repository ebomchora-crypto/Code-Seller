import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Loader2, Maximize, Minimize, Move, RefreshCw, RotateCcw, Trash2, ZoomIn, ZoomOut } from 'lucide-react'
import { toast } from 'sonner'
import { uploadPortfolioImage } from '@/services/supabase/portfolio'
import { MAX_ZOOM, cropOverflow, cropStyle, dragCrop, initialCrop, normalizeCrop } from '@/utils/portfolio'
import type { ImageCrop } from '@/types'

// Imagem do projeto já ajustada ao quadro (preenche o elemento pai, que define
// o formato). "Mostrar inteira" põe a imagem toda com um fundo desfocado dela.
export function ProjectCover({ src, crop, alt = '', className = '' }: { src: string; crop: ImageCrop | null | undefined; alt?: string; className?: string }) {
  const value = normalizeCrop(crop)
  if (value.fit === 'contain') {
    return (
      <div className={`relative size-full overflow-hidden ${className}`}>
        <img src={src} alt="" aria-hidden className="absolute inset-0 size-full scale-110 object-cover opacity-50 blur-xl" loading="lazy" />
        <img src={src} alt={alt} className="relative size-full object-contain" loading="lazy" draggable={false} />
      </div>
    )
  }
  return (
    <div className={`size-full overflow-hidden ${className}`}>
      <img src={src} alt={alt} className="size-full object-cover" style={cropStyle(value)} loading="lazy" draggable={false} />
    </div>
  )
}

interface CoverEditorProps {
  src: string
  crop: ImageCrop | null
  onCropChange: (crop: ImageCrop) => void
  onReplace: (url: string) => void
  onRemove: () => void
}

// Editor da imagem no quadro: arrastar para escolher a parte que aparece,
// zoom, e "mostrar inteira". O quadro é igual ao da página pública.
export function CoverEditor({ src, crop, onCropChange, onReplace, onRemove }: CoverEditorProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const drag = useRef<{ x: number; y: number; start: ImageCrop } | null>(null)
  const [natural, setNatural] = useState({ width: 0, height: 0 })
  const [frame, setFrame] = useState({ width: 0, height: 0 })
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const value = normalizeCrop(crop)
  const contain = value.fit === 'contain'

  // Imagem nova: descobre o tamanho real e escolhe o ajuste inicial.
  useEffect(() => {
    let cancelled = false
    const image = new Image()
    image.onload = () => {
      if (cancelled) return
      setNatural({ width: image.naturalWidth, height: image.naturalHeight })
      if (!crop) onCropChange(initialCrop(image.naturalWidth, image.naturalHeight))
    }
    image.src = src
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src])

  // Tamanho do quadro na tela (muda com a largura da janela).
  useEffect(() => {
    const element = frameRef.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => setFrame({ width: entry.contentRect.width, height: entry.contentRect.height }))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const overflow = (zoom = value.zoom) => cropOverflow(frame, natural, zoom)

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (contain) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { x: event.clientX, y: event.clientY, start: value }
    setDragging(true)
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!drag.current) return
    const { x, y, start } = drag.current
    onCropChange(dragCrop(start, event.clientX - x, event.clientY - y, overflow(start.zoom)))
  }

  function onPointerUp() {
    drag.current = null
    setDragging(false)
  }

  function setZoom(zoom: number) {
    onCropChange({ ...value, zoom: Math.min(MAX_ZOOM, Math.max(1, Math.round(zoom * 100) / 100)) })
  }

  async function replace(file: File | undefined) {
    if (!file) return
    setUploading(true)
    try {
      onReplace(await uploadPortfolioImage(file))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível enviar a imagem.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const movable = !contain && (overflow().x > 1 || overflow().y > 1)
  const controlButton =
    'inline-flex h-8 items-center gap-1.5 rounded-full border border-[var(--border-default)] px-3 text-[12.5px] font-medium text-[var(--text-secondary)] transition hover:border-[var(--accent-ring)] hover:text-[var(--accent-text)] disabled:opacity-40'
  const iconButton =
    'flex size-8 items-center justify-center rounded-full text-[var(--text-muted)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] disabled:opacity-30'

  return (
    <div className="flex flex-col gap-2.5">
      <div
        ref={frameRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={`group relative aspect-[16/10] w-full touch-none select-none overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[#0d0918] ${
          contain ? '' : dragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        <ProjectCover src={src} crop={value} />
        {movable && !dragging && (
          <span className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-[12px] font-medium text-white opacity-0 backdrop-blur transition group-hover:opacity-100">
            <Move className="size-3.5" />
            Arraste para ajustar
          </span>
        )}
        {uploading && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="size-5 animate-spin text-white" />
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className={`flex items-center gap-1 rounded-full border border-[var(--border-default)] px-1 ${contain ? 'opacity-40' : ''}`}>
          <button type="button" onClick={() => setZoom(value.zoom - 0.25)} disabled={contain || value.zoom <= 1} className={iconButton} aria-label="Diminuir zoom">
            <ZoomOut className="size-4" />
          </button>
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={value.zoom}
            disabled={contain}
            onChange={(event) => setZoom(Number(event.target.value))}
            aria-label="Zoom da imagem"
            className="h-1 w-24 cursor-pointer accent-[#8b5cf6] sm:w-32"
          />
          <button type="button" onClick={() => setZoom(value.zoom + 0.25)} disabled={contain || value.zoom >= MAX_ZOOM} className={iconButton} aria-label="Aumentar zoom">
            <ZoomIn className="size-4" />
          </button>
        </div>
        <button type="button" onClick={() => onCropChange({ ...value, fit: contain ? 'cover' : 'contain' })} className={controlButton}>
          {contain ? <Maximize className="size-3.5" /> : <Minimize className="size-3.5" />}
          {contain ? 'Preencher o quadro' : 'Mostrar inteira'}
        </button>
        <button type="button" onClick={() => onCropChange(initialCrop(natural.width, natural.height))} className={controlButton}>
          <RotateCcw className="size-3.5" />
          Recomeçar
        </button>
        <span className="ml-auto flex items-center">
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className={iconButton} title="Trocar imagem" aria-label="Trocar imagem">
            <RefreshCw className="size-4" />
          </button>
          <button type="button" onClick={onRemove} className={`${iconButton} hover:text-red-500`} title="Remover imagem" aria-label="Remover imagem">
            <Trash2 className="size-4" />
          </button>
        </span>
      </div>
      <p className="text-[11.5px] text-[var(--text-muted)]">
        {contain
          ? 'A imagem aparece inteira, com um fundo desfocado dela nas sobras.'
          : 'Arraste a imagem para escolher a parte que aparece e use o zoom para aproximar. Fica igual na sua página.'}
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => void replace(event.target.files?.[0])}
      />
    </div>
  )
}
