import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState, type ClipboardEvent, type DragEvent, type KeyboardEvent } from 'react'
import { ArrowUp, FileText, LoaderCircle, Paperclip, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { applyQuickPromptDraft, getChatSubmission, shouldSubmitChat } from '@/components/autopilot/composer.utils'
import {
  ATTACHMENT_ACCEPT,
  DEFAULT_ATTACHMENT_PROMPT,
  MAX_AI_IMAGES,
  MAX_ATTACHMENTS,
  formatFileSize,
  type PreparedAttachment,
} from '@/utils/copilotAttachments'

interface CopilotComposerProps {
  onSend: (content: string, attachments?: PreparedAttachment[]) => void
  sending: boolean
  hasContext: boolean
  size?: 'large' | 'compact'
}

export interface CopilotComposerHandle {
  applyDraft: (content: string) => void
}

interface PendingFile {
  id: string
  name: string
  size: number
  status: 'reading' | 'ready'
  file?: PreparedAttachment
}

const MIN_HEIGHT = { large: 76, compact: 48 }
const MAX_HEIGHT = 'min(32dvh, 240px)'

export const CopilotComposer = forwardRef<CopilotComposerHandle, CopilotComposerProps>(function CopilotComposer(
  { onSend, sending, hasContext, size = 'compact' },
  ref,
) {
  const [value, setValue] = useState('')
  const [files, setFiles] = useState<PendingFile[]>([])
  const [dragging, setDragging] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const reading = files.some((item) => item.status === 'reading')
  const ready = files.flatMap((item) => (item.file ? [item.file] : []))
  const submission = getChatSubmission(value) ?? (ready.length ? DEFAULT_ATTACHMENT_PROMPT : null)
  const canSend = Boolean(submission) && !sending && !reading

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = `${MIN_HEIGHT[size]}px`
    textarea.style.height = `min(${Math.max(textarea.scrollHeight, MIN_HEIGHT[size])}px, ${MAX_HEIGHT})`
  }, [size])

  useEffect(() => {
    adjustHeight()
  }, [adjustHeight, value])

  useImperativeHandle(ref, () => ({
    applyDraft(content: string) {
      setValue((current) => applyQuickPromptDraft(current, content))
      requestAnimationFrame(() => textareaRef.current?.focus())
    },
  }), [])

  async function addFiles(list: FileList | File[]) {
    const chosen = Array.from(list)
    if (!chosen.length) return
    const room = MAX_ATTACHMENTS - files.length
    if (room <= 0) {
      toast.error(`No máximo ${MAX_ATTACHMENTS} arquivos por mensagem.`)
      return
    }
    if (chosen.length > room) toast.error(`No máximo ${MAX_ATTACHMENTS} arquivos por mensagem. Anexei os primeiros.`)
    const pending = chosen.slice(0, room).map((file) => ({ id: crypto.randomUUID(), name: file.name, size: file.size, status: 'reading' as const, source: file }))
    setFiles((current) => [...current, ...pending.map(({ source: _source, ...item }) => item)])
    const { readAttachment } = await import('@/utils/readAttachment')
    for (const item of pending) {
      try {
        const file = await readAttachment(item.source)
        setFiles((current) => current.map((entry) => (entry.id === item.id ? { ...entry, status: 'ready', file } : entry)))
      } catch (error) {
        toast.error(error instanceof Error ? error.message : `Não foi possível ler "${item.name}".`)
        setFiles((current) => current.filter((entry) => entry.id !== item.id))
      }
    }
  }

  function removeFile(id: string) {
    setFiles((current) => current.filter((item) => item.id !== id))
  }

  function submit() {
    if (!canSend || !submission) return
    const images = ready.reduce((total, file) => total + file.images.length, 0)
    if (images > MAX_AI_IMAGES) {
      toast.error(`Envie no máximo ${MAX_AI_IMAGES} imagens por mensagem.`)
      return
    }
    onSend(submission, ready.length ? ready : undefined)
    setValue('')
    setFiles([])
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.nativeEvent.isComposing) return
    if (!shouldSubmitChat(event.key, event.shiftKey)) return
    event.preventDefault()
    submit()
  }

  // Colar um print (Ctrl+V) anexa a imagem.
  function handlePaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const pasted = Array.from(event.clipboardData.files)
    if (!pasted.length) return
    event.preventDefault()
    void addFiles(pasted)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    if (!sending) void addFiles(event.dataTransfer.files)
  }

  return (
    <div
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes('Files')) return
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false)
      }}
      onDrop={handleDrop}
      className={cn(
        'relative rounded-[24px] border border-[var(--border-default)] bg-[var(--field-bg)] shadow-[0_18px_50px_-24px_rgba(91,33,182,0.45)] transition-all focus-within:border-[var(--accent-ring)] focus-within:ring-4 focus-within:ring-[var(--accent-tint)]',
        dragging && 'border-[var(--accent-ring)] ring-4 ring-[var(--accent-tint)]',
      )}
    >
      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-[24px] bg-[var(--bg-primary)]/80 text-[14px] font-medium text-[var(--accent-text)]">
          Solte para anexar
        </div>
      )}

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pt-4">
          {files.map((item) => (
            <div
              key={item.id}
              className="group relative flex h-14 max-w-[230px] items-center gap-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] pl-1.5 pr-8"
            >
              {item.file?.thumb ? (
                <img src={item.file.thumb} alt="" className="size-11 shrink-0 rounded-lg object-cover" />
              ) : (
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-tint)] text-[var(--accent-text)]">
                  {item.status === 'reading' ? <LoaderCircle className="size-4 animate-spin" /> : <FileText className="size-4" />}
                </span>
              )}
              <span className="min-w-0">
                <span className="block truncate text-[12.5px] font-medium text-[var(--text-primary)]">{item.name}</span>
                <span className="block text-[11px] text-[var(--text-muted)]">
                  {item.status === 'reading' ? 'Lendo…' : formatFileSize(item.size)}
                </span>
              </span>
              <button
                type="button"
                onClick={() => removeFile(item.id)}
                aria-label={`Remover ${item.name}`}
                className="absolute right-1.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-[var(--text-muted)] transition hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)]"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        disabled={sending}
        rows={1}
        aria-label="Mensagem para o CS Copilot"
        placeholder={size === 'large' ? 'Pergunte sobre seus contatos, negócios, tarefas ou peça uma mensagem…' : 'Responda ou peça outra coisa…'}
        className="block w-full resize-none overflow-y-auto bg-transparent px-5 pt-4 text-[15px] leading-relaxed text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] disabled:opacity-60"
        style={{ height: MIN_HEIGHT[size] }}
      />

      <div className="flex items-center justify-between gap-3 px-3 pb-3 pt-1">
        <div className="flex min-w-0 items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ATTACHMENT_ACCEPT}
            className="hidden"
            onChange={(event) => {
              if (event.target.files) void addFiles(event.target.files)
              event.target.value = ''
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={sending || files.length >= MAX_ATTACHMENTS}
            aria-label="Anexar arquivos"
            title="Anexar imagem, PDF, Word ou texto"
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Paperclip className="size-[18px]" />
          </button>
          <span className="inline-flex h-8 min-w-0 items-center gap-2 rounded-full bg-[var(--bg-muted)] px-3 text-[12px] font-medium text-[var(--text-secondary)]">
            <span
              className={cn('size-1.5 shrink-0 rounded-full', hasContext ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'animate-pulse bg-[var(--accent-solid)]')}
            />
            <span className="truncate">{hasContext ? 'Contexto pronto' : 'Carregando seus dados…'}</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden text-[11.5px] text-[var(--text-muted)] sm:inline">Enter envia · Shift+Enter quebra linha</span>
          <button
            type="button"
            onClick={submit}
            disabled={!canSend}
            aria-label="Enviar mensagem"
            className={cn(
              'flex size-10 items-center justify-center rounded-full transition-all duration-200',
              canSend
                ? 'bg-[linear-gradient(135deg,#8b5cf6,#6d28d9)] text-white shadow-[0_8px_22px_-8px_rgba(124,58,237,0.9)] hover:brightness-110'
                : 'cursor-not-allowed bg-[var(--bg-muted)] text-[var(--text-muted)]',
            )}
          >
            {sending ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowUp className="size-[18px]" strokeWidth={2.2} />}
          </button>
        </div>
      </div>
    </div>
  )
})
