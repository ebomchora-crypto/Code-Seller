import { useRef, useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { uploadPortfolioImage } from '@/services/supabase/portfolio'

interface ImageUploaderProps {
  value: string | null
  onChange: (url: string | null) => void
  /** 'cover' = capa 16:10 do projeto; 'avatar' = foto redonda. */
  variant?: 'cover' | 'avatar'
  label: string
}

export function ImageUploader({ value, onChange, variant = 'cover', label }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(file: File | undefined) {
    if (!file) return
    setUploading(true)
    try {
      onChange(await uploadPortfolioImage(file))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível enviar a imagem.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const shape = variant === 'avatar' ? 'size-24 rounded-full' : 'aspect-[16/10] w-full rounded-2xl'

  return (
    <div className={variant === 'avatar' ? 'flex items-center gap-4' : ''}>
      <div className={`relative overflow-hidden border border-dashed border-[var(--border-strong)] bg-[var(--bg-muted)] ${shape}`}>
        {value ? (
          <>
            <img src={value} alt="" className="size-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label="Remover imagem"
              className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
            >
              <X className="size-3.5" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex size-full flex-col items-center justify-center gap-1.5 text-[12.5px] text-[var(--text-muted)] transition-colors hover:text-[var(--accent-text)]"
          >
            {uploading ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
            {variant === 'cover' && (uploading ? 'Enviando…' : label)}
          </button>
        )}
      </div>
      {variant === 'avatar' && (
        <div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="text-[13px] font-medium text-[var(--accent-text)] hover:underline"
          >
            {uploading ? 'Enviando…' : value ? 'Trocar foto' : label}
          </button>
          <p className="mt-0.5 text-[12px] text-[var(--text-muted)]">JPG, PNG ou WebP até 3 MB.</p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />
    </div>
  )
}
