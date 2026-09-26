import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { ArrowUp, LoaderCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getChatSubmission, shouldSubmitChat } from '@/components/autopilot/composer.utils'

interface CopilotComposerProps {
  onSend: (content: string) => void
  sending: boolean
  hasContext: boolean
  size?: 'large' | 'compact'
}

const MIN_HEIGHT = { large: 76, compact: 48 }
const MAX_HEIGHT = 200

export function CopilotComposer({ onSend, sending, hasContext, size = 'compact' }: CopilotComposerProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const submission = getChatSubmission(value)

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = `${MIN_HEIGHT[size]}px`
    textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, MIN_HEIGHT[size]), MAX_HEIGHT)}px`
  }, [size])

  useEffect(() => {
    adjustHeight()
  }, [adjustHeight, value])

  function submit() {
    if (!submission || sending) return
    onSend(submission)
    setValue('')
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!shouldSubmitChat(event.key, event.shiftKey)) return
    event.preventDefault()
    submit()
  }

  return (
    <div className="rounded-[24px] border border-[var(--border-default)] bg-[var(--field-bg)] shadow-[0_18px_50px_-24px_rgba(91,33,182,0.45)] transition-all focus-within:border-[var(--accent-ring)] focus-within:ring-4 focus-within:ring-[var(--accent-tint)]">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={sending}
        rows={1}
        aria-label="Mensagem para o CS Copilot"
        placeholder={size === 'large' ? 'Pergunte sobre seus contatos, negócios, tarefas ou peça uma mensagem…' : 'Responda ou peça outra coisa…'}
        className="block w-full resize-none bg-transparent px-5 pt-4 text-[15px] leading-relaxed text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] disabled:opacity-60"
        style={{ height: MIN_HEIGHT[size] }}
      />

      <div className="flex items-center justify-between gap-3 px-3 pb-3 pt-1">
        <span className="inline-flex h-8 items-center gap-2 rounded-full bg-[var(--bg-muted)] px-3 text-[12px] font-medium text-[var(--text-secondary)]">
          <span
            className={cn('size-1.5 rounded-full', hasContext ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'animate-pulse bg-[var(--accent-solid)]')}
          />
          {hasContext ? 'Lendo seus dados' : 'Carregando seus dados…'}
        </span>

        <div className="flex items-center gap-3">
          <span className="hidden text-[11.5px] text-[var(--text-muted)] sm:inline">Enter envia · Shift+Enter quebra linha</span>
          <button
            type="button"
            onClick={submit}
            disabled={!submission || sending}
            aria-label="Enviar mensagem"
            className={cn(
              'flex size-10 items-center justify-center rounded-full transition-all duration-200',
              submission && !sending
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
}
