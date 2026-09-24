import { useRef, useState } from 'react'
import { Camera } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'

interface AvatarUploadProps {
  imageUrl: string | null
  fallbackText: string
  onUpload: (file: File) => Promise<void>
  onDelete: () => Promise<void>
  uploading: boolean
  shape?: 'circle' | 'square'
  label?: string
}

const MAX_SIZE_BYTES = 2 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function AvatarUpload({
  imageUrl,
  fallbackText,
  onUpload,
  onDelete,
  uploading,
  shape = 'circle',
  label = 'Foto',
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)

  function handleFileSelected(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Formato inválido. Envie uma imagem JPEG, PNG ou WebP.')
      return
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error('Arquivo muito grande. O limite é 2MB.')
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    void onUpload(file).finally(() => {
      URL.revokeObjectURL(objectUrl)
      setPreview(null)
    })
  }

  const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-xl'
  const displayUrl = preview ?? imageUrl

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className={`group relative h-20 w-20 shrink-0 overflow-hidden ${shapeClass} bg-purple-100`}
        aria-label={`Alterar ${label.toLowerCase()}`}
      >
        {displayUrl ? (
          <img src={displayUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-xl font-medium text-purple-700">
            {fallbackText}
          </span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-neutral-900/0 text-white opacity-0 transition-all duration-150 group-hover:bg-neutral-900/40 group-hover:opacity-100">
          <Camera className="h-5 w-5" />
        </span>
      </button>

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" loading={uploading} onClick={() => fileInputRef.current?.click()}>
            Alterar {label.toLowerCase()}
          </Button>
          {imageUrl && (
            <Button variant="ghost" size="sm" onClick={() => void onDelete()} disabled={uploading}>
              Remover
            </Button>
          )}
        </div>
        <p className="text-xs text-neutral-400">JPEG, PNG ou WebP · máx 2MB</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) handleFileSelected(file)
          event.target.value = ''
        }}
      />
    </div>
  )
}
