import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { ArrowUp, ImagePlus, Loader2, Square, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import type { AttachmentsState } from '@/components/code-maker/Attachments'

const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ')

// ---- Textarea ----
const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      'cm-prompt-textarea flex min-h-[44px] w-full resize-none rounded-md border-none bg-transparent px-3 py-2.5 text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    ref={ref}
    rows={1}
    {...props}
  />
))
Textarea.displayName = 'Textarea'

// ---- Tooltip ----
const TooltipProvider = TooltipPrimitive.Provider
const Tooltip = TooltipPrimitive.Root
const TooltipTrigger = TooltipPrimitive.Trigger
const TooltipContent = React.forwardRef<React.ElementRef<typeof TooltipPrimitive.Content>, React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>>(
  ({ className, sideOffset = 6, ...props }, ref) => (
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn('z-[90] overflow-hidden rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] px-2.5 py-1.5 text-[12px] text-[var(--text-primary)] shadow-[var(--shadow-card)]', className)}
      {...props}
    />
  ),
)
TooltipContent.displayName = TooltipPrimitive.Content.displayName

// ---- Dialog (visualização da imagem anexada) ----
const Dialog = DialogPrimitive.Root
const DialogPortal = DialogPrimitive.Portal
const DialogOverlay = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Overlay>, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>>(
  ({ className, ...props }, ref) => <DialogPrimitive.Overlay ref={ref} className={cn('fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm', className)} {...props} />,
)
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName
const DialogContent = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Content>, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>>(
  ({ className, children, ...props }, ref) => (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn('fixed left-1/2 top-1/2 z-[81] grid w-full max-w-[90vw] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-0 shadow-xl md:max-w-[800px]', className)}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-2 text-white transition hover:bg-black/80">
          <X className="h-4 w-4" />
          <span className="sr-only">Fechar</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  ),
)
DialogContent.displayName = DialogPrimitive.Content.displayName
const DialogTitle = DialogPrimitive.Title

function ImageViewDialog({ imageUrl, onClose }: { imageUrl: string | null; onClose: () => void }) {
  if (!imageUrl) return null
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="overflow-hidden">
        <DialogTitle className="sr-only">Imagem anexada</DialogTitle>
        <DialogPrimitive.Description className="sr-only">Visualização ampliada da imagem anexada ao pedido.</DialogPrimitive.Description>
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
          <img src={imageUrl} alt="Imagem anexada" className="max-h-[80vh] w-full rounded-2xl object-contain" />
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}

// ---- Divisória entre os botões de opção ----
export const CustomDivider: React.FC = () => (
  <div className="relative mx-1 h-6 w-[1.5px]">
    <div
      className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-[#9b87f5]/70 to-transparent"
      style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 40%, 140% 50%, 100% 60%, 100% 100%, 0% 100%, 0% 60%, -40% 50%, 0% 40%)' }}
    />
  </div>
)

// ---- Botão de opção (aparece com o texto quando ligado) ----
export function PromptToggle({
  active,
  onClick,
  icon,
  label,
  color = '#8B5CF6',
  title,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  color?: string
  title?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={title}
      className={cn('flex h-8 items-center gap-1 rounded-full border px-2 py-1 transition-all', active ? '' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]')}
      style={active ? { color, borderColor: color, background: `${color}26` } : undefined}
    >
      <span className="flex size-5 shrink-0 items-center justify-center">
        <motion.span animate={{ rotate: active ? 360 : 0, scale: active ? 1.1 : 1 }} whileHover={{ rotate: active ? 360 : 15, scale: 1.1 }} transition={{ type: 'spring', stiffness: 260, damping: 25 }}>
          {icon}
        </motion.span>
      </span>
      <AnimatePresence>
        {active && (
          <motion.span initial={{ width: 0, opacity: 0 }} animate={{ width: 'auto', opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="shrink-0 overflow-hidden whitespace-nowrap text-xs">
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}

// ---- Caixa de pedido ----
export interface PromptInputBoxProps {
  value: string
  onValueChange: (value: string) => void
  /** Enviar (Enter ou botão). */
  onSend: () => void
  /** Parar a geração (aparece no lugar de enviar enquanto `isLoading`). */
  onStop?: () => void
  isLoading?: boolean
  disabled?: boolean
  /** Texto de ajuda; com vários textos, eles se alternam sozinhos. */
  placeholder?: string | string[]
  /** Imagens anexadas (logo e fotos): usa o mesmo estado do resto do Code Maker. */
  attachments?: AttachmentsState
  /** Botões extras ao lado do anexo (ex.: escolher o estilo do site). */
  tools?: React.ReactNode
  /** Texto pequeno à direita, antes do botão de enviar. */
  footnote?: React.ReactNode
  /** Pode enviar? Padrão: tem texto. */
  canSend?: boolean
  rows?: number
  /** Altura mínima da área de texto, em px. */
  minHeight?: number
  maxHeight?: number
  ariaLabel?: string
  className?: string
}

export const PromptInputBox = React.forwardRef<HTMLDivElement, PromptInputBoxProps>(function PromptInputBox(
  { value, onValueChange, onSend, onStop, isLoading = false, disabled = false, placeholder = 'Escreva aqui…', attachments, tools, footnote, canSend, rows = 1, minHeight = 44, maxHeight = 320, ariaLabel, className },
  ref,
) {
  const [viewing, setViewing] = React.useState<string | null>(null)
  const [dragging, setDragging] = React.useState(false)
  const [tick, setTick] = React.useState(0)
  const textarea = React.useRef<HTMLTextAreaElement>(null)
  const upload = React.useRef<HTMLInputElement>(null)
  const placeholders = Array.isArray(placeholder) ? placeholder : [placeholder]
  const locked = disabled || isLoading
  const hasContent = value.trim().length > 0 || Boolean(attachments && attachments.assets.length > 0)
  const ready = canSend ?? hasContent

  React.useEffect(() => {
    if (placeholders.length < 2) return
    const timer = window.setInterval(() => setTick((current) => current + 1), 3500)
    return () => window.clearInterval(timer)
  }, [placeholders.length])

  // Cresce com o texto, até o limite.
  React.useEffect(() => {
    const element = textarea.current
    if (!element) return
    element.style.height = 'auto'
    element.style.height = `${Math.min(Math.max(element.scrollHeight, minHeight), maxHeight)}px`
    element.style.overflowY = element.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [value, minHeight, maxHeight])

  const submit = () => {
    if (!locked && ready) onSend()
  }

  return (
    <TooltipProvider delayDuration={250}>
      <div
        ref={ref}
        className={cn(
          'relative w-full rounded-3xl border bg-[var(--bg-card)] p-2 shadow-[0_30px_80px_-40px_rgba(124,58,237,0.55)] transition-all duration-300 focus-within:border-[var(--accent-ring)] focus-within:ring-4 focus-within:ring-[var(--accent-tint)]',
          dragging ? 'border-[var(--accent-ring)] ring-4 ring-[var(--accent-tint)]' : 'border-[var(--border-default)]',
          isLoading && 'border-[var(--accent-ring)]',
          className,
        )}
        onDragOver={(event) => {
          if (!attachments || !event.dataTransfer.types.includes('Files')) return
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          if (!attachments || !event.dataTransfer.files.length) return
          event.preventDefault()
          setDragging(false)
          if (!locked) attachments.add(event.dataTransfer.files)
        }}
      >
        {dragging && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-[var(--panel-bg)]/85 text-[14px] font-medium text-[var(--accent-text)]">
            Solte aqui a logo e as fotos do cliente
          </div>
        )}

        {attachments && attachments.items.length > 0 && (
          <div className="flex flex-wrap gap-2 px-2 pb-1 pt-1">
            {attachments.items.map((item) => (
              <div key={item.id} className="group relative">
                <button
                  type="button"
                  onClick={() => setViewing(item.preview)}
                  className={cn('relative block size-16 overflow-hidden rounded-xl border bg-[var(--bg-muted)] transition-all duration-300', item.kind === 'logo' ? 'border-[var(--accent-ring)]' : 'border-[var(--border-default)]', item.status === 'error' && 'opacity-40')}
                  aria-label="Ver imagem"
                >
                  <img src={item.preview} alt="" className={cn('size-full', item.kind === 'logo' ? 'object-contain p-1.5' : 'object-cover')} />
                  {item.status === 'uploading' && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/45">
                      <Loader2 className="size-4 animate-spin text-white" />
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => attachments.toggleLogo(item.id)}
                  disabled={item.status !== 'done'}
                  title={item.kind === 'logo' ? 'Esta é a logo (toque para virar foto)' : 'Usar como logo'}
                  className={cn('absolute -bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-1.5 py-px text-[10px] font-semibold shadow', item.kind === 'logo' ? 'bg-[linear-gradient(135deg,#8b5cf6,#6d28d9)] text-white' : 'bg-[var(--panel-bg)] text-[var(--text-muted)] ring-1 ring-[var(--border-default)]')}
                >
                  {item.kind === 'logo' ? 'Logo' : 'Foto'}
                </button>
                <button
                  type="button"
                  onClick={() => attachments.remove(item.id)}
                  aria-label="Remover imagem"
                  className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-black/75 text-white shadow transition hover:bg-black"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <Textarea
          ref={textarea}
          value={value}
          rows={rows}
          disabled={locked}
          aria-label={ariaLabel}
          placeholder={placeholders[tick % placeholders.length]}
          onChange={(event) => onValueChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault()
              submit()
            } else if (event.key === 'Escape' && value) {
              event.preventDefault()
              onValueChange('')
            }
          }}
          onPaste={(event) => {
            if (attachments && event.clipboardData.files.length && !locked) {
              event.preventDefault()
              attachments.add(event.clipboardData.files)
            }
          }}
        />

        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex min-w-0 items-center gap-1">
            {attachments && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      disabled={locked}
                      onClick={() => upload.current?.click()}
                      aria-label="Anexar logo ou fotos"
                      className="flex size-8 cursor-pointer items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] disabled:pointer-events-none disabled:opacity-40"
                    >
                      <ImagePlus className="size-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Anexar logo ou fotos</TooltipContent>
                </Tooltip>
                <input
                  ref={upload}
                  type="file"
                  multiple
                  className="hidden"
                  accept="image/png,image/jpeg,image/webp,image/heic"
                  onChange={(event) => {
                    if (event.target.files?.length) attachments.add(event.target.files)
                    event.target.value = ''
                  }}
                />
              </>
            )}
            {tools && (
              <>
                {attachments && <CustomDivider />}
                <div className="flex min-w-0 items-center gap-1">{tools}</div>
              </>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {footnote && <span className="hidden text-[12px] tabular-nums text-[var(--text-muted)] sm:inline">{footnote}</span>}
            <Tooltip>
              <TooltipTrigger asChild>
                {isLoading ? (
                  <button
                    type="button"
                    onClick={onStop}
                    aria-label="Parar"
                    className="flex size-9 items-center justify-center rounded-full bg-[var(--bg-muted)] text-[var(--text-primary)] transition hover:bg-[var(--bg-card-hover)]"
                  >
                    <Square className="size-3.5 animate-pulse fill-current" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={submit}
                    disabled={disabled || !ready}
                    aria-label="Enviar"
                    className="flex size-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,#8b5cf6,#6d28d9)] text-white shadow-[0_6px_18px_-6px_rgba(124,58,237,0.8)] transition hover:brightness-110 disabled:bg-[var(--bg-muted)] disabled:text-[var(--text-muted)] disabled:shadow-none"
                  >
                    <ArrowUp className="size-4.5" />
                  </button>
                )}
              </TooltipTrigger>
              <TooltipContent side="top">{isLoading ? 'Parar a geração' : ready ? 'Enviar (Enter)' : 'Escreva para enviar'}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
      <ImageViewDialog imageUrl={viewing} onClose={() => setViewing(null)} />
    </TooltipProvider>
  )
})
PromptInputBox.displayName = 'PromptInputBox'
