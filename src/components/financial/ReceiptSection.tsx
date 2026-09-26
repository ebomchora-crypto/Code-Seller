import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { getSignedReceiptUrl } from '@/services/supabase/transactions'

interface ReceiptSectionProps {
  receiptUrl: string | null
  onUpload: (file: File) => Promise<void>
  uploading: boolean
  onDelete: () => Promise<void>
}

function fileNameFromPath(path: string): string {
  return path.split('/').pop() ?? path
}

export function ReceiptSection({ receiptUrl, onUpload, uploading, onDelete }: ReceiptSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [viewing, setViewing] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleView() {
    if (!receiptUrl) return
    const newTab = window.open('', '_blank')
    setViewing(true)
    try {
      const url = await getSignedReceiptUrl(receiptUrl)
      if (newTab) newTab.location.href = url
    } catch (err) {
      newTab?.close()
      toast.error(err instanceof Error ? err.message : 'Não foi possível abrir o comprovante.')
    } finally {
      setViewing(false)
    }
  }

  async function handleConfirmDelete() {
    setDeleting(true)
    await onDelete()
    setDeleting(false)
    setDeleteOpen(false)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium text-[var(--text-secondary)]">Comprovante</label>

      {!receiptUrl ? (
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            loading={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            Anexar comprovante
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void onUpload(file)
              event.target.value = ''
            }}
          />
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-xl border border-[var(--border-default)] px-3 py-2">
          <span className="max-w-[160px] truncate text-sm text-[var(--text-primary)]">{fileNameFromPath(receiptUrl)}</span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleView}
              disabled={viewing}
              className="text-xs font-medium text-[var(--accent-text)] hover:underline disabled:opacity-50"
            >
              Visualizar
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Substituir
            </button>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="text-xs font-medium text-[var(--text-secondary)] hover:text-red-500"
            >
              Remover
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void onUpload(file)
                event.target.value = ''
              }}
            />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        title="Remover comprovante"
        message="Tem certeza que deseja remover o comprovante anexado a esta transação?"
        confirmLabel="Remover"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  )
}
