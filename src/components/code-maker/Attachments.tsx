import { useCallback, useEffect, useRef, useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { uploadSiteAsset } from '@/services/supabase/codeMaker'
import type { SiteAsset } from '../../../supabase/functions/code-maker/site'

export interface Attachment {
  id: string
  preview: string
  kind: 'logo' | 'photo'
  url: string | null
  status: 'uploading' | 'done' | 'error'
}

const MAX_FILES = 8

// Anexos de um pedido (logo e fotos do cliente): envia assim que escolhe.
export function useAttachments() {
  const [items, setItems] = useState<Attachment[]>([])
  const previews = useRef<string[]>([])

  useEffect(
    () => () => {
      previews.current.forEach((url) => URL.revokeObjectURL(url))
    },
    [],
  )

  const add = useCallback(
    (files: FileList | File[]) => {
      const images = Array.from(files).filter((file) => file.type.startsWith('image/') || /\.(jpe?g|png|webp|heic)$/i.test(file.name))
      if (images.length === 0) return
      const room = MAX_FILES - items.length
      if (room <= 0) {
        toast.error(`No máximo ${MAX_FILES} imagens por pedido.`)
        return
      }
      // Arquivo com "logo" no nome vira a logo (dá para trocar depois).
      const logoIndex = items.some((item) => item.kind === 'logo') ? -1 : images.findIndex((file) => /logo|marca/i.test(file.name))
      const created = images.slice(0, room).map((file, index) => {
        const preview = URL.createObjectURL(file)
        previews.current.push(preview)
        const kind: Attachment['kind'] = index === logoIndex ? 'logo' : 'photo'
        return { file, item: { id: crypto.randomUUID(), preview, kind, url: null, status: 'uploading' } as Attachment }
      })
      setItems((current) => [...current, ...created.map(({ item }) => item)])
      for (const { file, item } of created) {
        uploadSiteAsset(file, item.kind)
          .then((url) => setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, url, status: 'done' } : entry))))
          .catch((error: Error) => {
            toast.error(error.message)
            setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, status: 'error' } : entry)))
          })
      }
    },
    [items],
  )

  const remove = useCallback((id: string) => setItems((current) => current.filter((item) => item.id !== id)), [])

  // Só uma logo: marcar uma desmarca a outra.
  const toggleLogo = useCallback(
    (id: string) =>
      setItems((current) =>
        current.map((item) =>
          item.id === id ? { ...item, kind: item.kind === 'logo' ? 'photo' : 'logo' } : item.kind === 'logo' ? { ...item, kind: 'photo' } : item,
        ),
      ),
    [],
  )

  const clear = useCallback(() => setItems([]), [])

  const assets: SiteAsset[] = items.filter((item) => item.status === 'done' && item.url).map((item) => ({ url: item.url as string, kind: item.kind }))
  const uploading = items.some((item) => item.status === 'uploading')

  return { items, add, remove, toggleLogo, clear, assets, uploading }
}

export type AttachmentsState = ReturnType<typeof useAttachments>

export function AttachButton({ onFiles, disabled, compact = false }: { onFiles: (files: FileList) => void; disabled?: boolean; compact?: boolean }) {
  const input = useRef<HTMLInputElement>(null)
  return (
    <>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/heic"
        multiple
        className="hidden"
        onChange={(event) => {
          if (event.target.files?.length) onFiles(event.target.files)
          event.target.value = ''
        }}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => input.current?.click()}
        title="Anexar logo ou fotos"
        aria-label="Anexar logo ou fotos"
        className={`flex items-center gap-1.5 rounded-full border border-[var(--border-default)] text-[12.5px] font-medium text-[var(--text-secondary)] transition hover:border-[var(--accent-ring)] hover:text-[var(--accent-text)] disabled:opacity-40 ${
          compact ? 'size-9 justify-center rounded-xl' : 'px-3 py-1.5'
        }`}
      >
        <ImagePlus className="size-4" />
        {!compact && 'Anexar'}
      </button>
    </>
  )
}

export function AttachmentTray({ state }: { state: AttachmentsState }) {
  if (state.items.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2 px-1 pb-2">
      {state.items.map((item) => (
        <div key={item.id} className="group relative">
          <div
            className={`relative size-16 overflow-hidden rounded-xl border bg-[var(--bg-muted)] ${
              item.kind === 'logo' ? 'border-[var(--accent-ring)]' : 'border-[var(--border-default)]'
            } ${item.status === 'error' ? 'opacity-40' : ''}`}
          >
            <img src={item.preview} alt="" className={`size-full ${item.kind === 'logo' ? 'object-contain p-1.5' : 'object-cover'}`} />
            {item.status === 'uploading' && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/45">
                <Loader2 className="size-4 animate-spin text-white" />
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => state.toggleLogo(item.id)}
            disabled={item.status !== 'done'}
            title={item.kind === 'logo' ? 'Esta é a logo (toque para virar foto)' : 'Usar como logo'}
            className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-1.5 py-px text-[10px] font-semibold shadow ${
              item.kind === 'logo' ? 'bg-[linear-gradient(135deg,#8b5cf6,#6d28d9)] text-white' : 'bg-[var(--panel-bg)] text-[var(--text-muted)] ring-1 ring-[var(--border-default)]'
            }`}
          >
            {item.kind === 'logo' ? 'Logo' : 'Foto'}
          </button>
          <button
            type="button"
            onClick={() => state.remove(item.id)}
            aria-label="Remover imagem"
            className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-[var(--panel-bg)] text-[var(--text-secondary)] shadow ring-1 ring-[var(--border-default)] transition hover:text-red-500"
          >
            <X className="size-3" />
          </button>
        </div>
      ))}
    </div>
  )
}
