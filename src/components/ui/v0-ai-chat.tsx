import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import { ArrowUp, LoaderCircle, Sparkles, type LucideIcon } from 'lucide-react'
import { Textarea } from '@/components/ui/Textarea'
import { cn } from '@/lib/utils'
import { getChatSubmission, shouldSubmitChat } from './v0-ai-chat.utils'

export interface AiChatQuickAction {
  id: string
  label: string
  prompt: string
  icon: LucideIcon
}

interface V0AiChatProps {
  onSend: (content: string) => void
  sending: boolean
  hasContext: boolean
  variant?: 'welcome' | 'compact'
  quickActions?: AiChatQuickAction[]
  title?: string
  description?: string
}

function useAutoResizeTextarea(minHeight: number, maxHeight: number) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = useCallback(
    (reset = false) => {
      const textarea = textareaRef.current
      if (!textarea) return
      textarea.style.height = `${minHeight}px`
      if (!reset) textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`
    },
    [maxHeight, minHeight],
  )

  useEffect(() => {
    adjustHeight(true)
  }, [adjustHeight])

  useEffect(() => {
    const handleResize = () => adjustHeight()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [adjustHeight])

  return { textareaRef, adjustHeight }
}

export function V0AiChat({
  onSend,
  sending,
  hasContext,
  variant = 'compact',
  quickActions = [],
  title = 'O que posso fazer por você?',
  description = 'Analise seu funil, prepare abordagens e transforme informações em próximas ações.',
}: V0AiChatProps) {
  const [value, setValue] = useState('')
  const { textareaRef, adjustHeight } = useAutoResizeTextarea(60, 180)
  const isWelcome = variant === 'welcome'
  const submission = getChatSubmission(value)

  function submit(content = value) {
    const nextMessage = getChatSubmission(content)
    if (!nextMessage || sending) return
    onSend(nextMessage)
    setValue('')
    adjustHeight(true)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!shouldSubmitChat(event.key, event.shiftKey)) return
    event.preventDefault()
    submit()
  }

  return (
    <div
      className={cn(
        'flex w-full flex-col items-center',
        isWelcome ? 'mx-auto max-w-4xl justify-center px-4 py-10 sm:px-8' : 'px-4 pb-4 pt-3 sm:px-8 sm:pb-6',
      )}
    >
      {isWelcome && (
        <div className="mb-8 max-w-2xl text-center">
          <span className="mx-auto mb-4 flex size-10 items-center justify-center rounded-xl border border-accent-bright/25 bg-accent-bright/10 text-accent-bright shadow-[0_0_28px_rgba(179,92,255,0.15)]">
            <Sparkles className="size-[18px]" />
          </span>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/45">{description}</p>
        </div>
      )}

      <div className={cn('w-full', isWelcome ? 'max-w-3xl' : 'max-w-4xl')}>
        <div className="overflow-hidden rounded-2xl border border-white/[0.12] bg-white/[0.055] shadow-[0_20px_70px_rgba(11,0,20,0.45),0_0_36px_rgba(179,92,255,0.06)] backdrop-blur-xl transition-colors focus-within:border-accent-bright/40">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => {
              setValue(event.target.value)
              adjustHeight()
            }}
            onKeyDown={handleKeyDown}
            disabled={sending}
            rows={1}
            aria-label="Mensagem para o AutoPilot"
            placeholder="Pergunte algo sobre seu negócio..."
            className="min-h-[60px] !w-full !resize-none !rounded-none !border-0 !bg-transparent px-4 pb-2 pt-4 text-sm leading-relaxed !text-white shadow-none !outline-none !ring-0 placeholder:!text-white/30 focus:!border-0 focus:!ring-0 disabled:opacity-60"
            style={{ overflow: 'hidden' }}
          />

          <div className="flex items-center justify-between gap-3 px-3 pb-3">
            <span className="inline-flex h-8 items-center gap-2 rounded-lg border border-dashed border-white/[0.12] bg-white/[0.025] px-2.5 text-[11px] font-medium text-white/45">
              <span className={cn('size-1.5 rounded-full', hasContext ? 'bg-emerald-400' : 'animate-pulse bg-accent-bright')} />
              {hasContext ? 'Contexto ativo' : 'Carregando contexto'}
            </span>

            <button
              type="button"
              onClick={() => submit()}
              disabled={!submission || sending}
              aria-label="Enviar mensagem"
              className={cn(
                'flex size-8 items-center justify-center rounded-lg border transition-all duration-200',
                submission && !sending
                  ? 'border-white bg-white text-accent-ink hover:bg-accent-soft'
                  : 'cursor-not-allowed border-white/10 bg-white/[0.04] text-white/25',
              )}
            >
              {sending ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
            </button>
          </div>
        </div>

        {isWelcome && quickActions.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => submit(action.prompt)}
                  disabled={sending}
                  className="inline-flex min-h-9 items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.035] px-3.5 py-2 text-xs font-medium text-white/50 transition-colors hover:border-accent-bright/30 hover:bg-white/[0.075] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Icon className="size-3.5 text-accent-bright/80" />
                  {action.label}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
