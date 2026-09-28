import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { ArrowUp, ChevronDown, Loader2 } from 'lucide-react'
import type { SiteStyle } from '../../../supabase/functions/code-maker/site'
import { AttachButton, AttachmentTray, type AttachmentsState } from '@/components/code-maker/Attachments'

const STYLES: { value: SiteStyle; label: string; swatch: string[] }[] = [
  { value: 'auto', label: 'A IA escolhe o estilo', swatch: ['#a78bfa', '#f472b6', '#fbbf24'] },
  { value: 'dark', label: 'Moderno escuro', swatch: ['#0b0b0f', '#1c1c24', '#22d3ee'] },
  { value: 'minimal', label: 'Minimalista', swatch: ['#fafaf9', '#e7e5e4', '#18181b'] },
  { value: 'elegant', label: 'Elegante', swatch: ['#f5efe6', '#1f2a24', '#b08d57'] },
  { value: 'vibrant', label: 'Vibrante', swatch: ['#ff5a36', '#ffd23f', '#3a86ff'] },
]

// Ideias prontas: um clique preenche o pedido inteiro.
export const PROMPT_IDEAS: { label: string; prompt: string }[] = [
  {
    label: 'Barbearia moderna',
    prompt:
      'Site para a Barbearia do João, em Campinas. Visual escuro e masculino com detalhes dourados. Corte a partir de R$ 45, barba R$ 35 e combo R$ 70. Atende com hora marcada pelo WhatsApp (19) 99888-7777, de terça a sábado das 9h às 20h.',
  },
  {
    label: 'Clínica odontológica',
    prompt:
      'Site para a Clínica Sorriso Pleno, dentista em Belo Horizonte. Visual claro, limpo e confiável, com azul e branco. Serviços: limpeza, clareamento, implante e aparelho. Agendamento pelo WhatsApp.',
  },
  {
    label: 'Restaurante italiano',
    prompt:
      'Site para a Cantina Nonna Rosa, restaurante italiano em Curitiba. Clima aconchegante, tons de vinho e creme, fonte elegante. Cardápio com massas, risotos e sobremesas, reservas pelo WhatsApp.',
  },
  {
    label: 'Oficina mecânica',
    prompt:
      'Site para a Auto Center Vila Nova, oficina mecânica em Jundiaí. Visual forte, grafite e laranja. Revisão, freios, suspensão e injeção eletrônica, com orçamento pelo WhatsApp.',
  },
  {
    label: 'Advocacia',
    prompt:
      'Site para o escritório Almeida Advocacia, em São Paulo, especializado em direito trabalhista e previdenciário. Visual elegante e sóbrio, azul-marinho e dourado. Primeira consulta pelo WhatsApp.',
  },
]

const PLACEHOLDERS = [
  'Site para uma barbearia em Campinas, visual escuro com dourado…',
  'Landing page para uma clínica de estética, clara e elegante…',
  'Site para uma pizzaria com cardápio e pedido pelo WhatsApp…',
]

interface PromptBoxProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (style: SiteStyle) => void
  busy: boolean
  disabled?: boolean
  footnote?: string | null
  attachments: AttachmentsState
}

export function PromptBox({ value, onChange, onSubmit, busy, disabled = false, footnote, attachments }: PromptBoxProps) {
  const [dragging, setDragging] = useState(false)
  const [style, setStyle] = useState<SiteStyle>('auto')
  const [styleOpen, setStyleOpen] = useState(false)
  const [placeholder, setPlaceholder] = useState(0)
  const textarea = useRef<HTMLTextAreaElement>(null)
  const current = STYLES.find((option) => option.value === style) ?? STYLES[0]
  const canSend = value.trim().length >= 8 && !busy && !disabled && !attachments.uploading

  // Cresce com o texto (até um limite).
  useEffect(() => {
    const element = textarea.current
    if (!element) return
    element.style.height = 'auto'
    element.style.height = `${Math.min(element.scrollHeight, 320)}px`
  }, [value])

  useEffect(() => {
    const timer = window.setInterval(() => setPlaceholder((index) => (index + 1) % PLACEHOLDERS.length), 3500)
    return () => window.clearInterval(timer)
  }, [])

  function submit(event?: FormEvent) {
    event?.preventDefault()
    if (canSend) onSubmit(style)
  }

  function handleKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <form
      onSubmit={submit}
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes('Files')) return
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        if (!event.dataTransfer.files.length) return
        event.preventDefault()
        setDragging(false)
        attachments.add(event.dataTransfer.files)
      }}
      className={`relative rounded-[26px] border bg-[var(--bg-card)] p-3 shadow-[0_30px_80px_-40px_rgba(124,58,237,0.55)] transition focus-within:border-[var(--accent-ring)] focus-within:ring-4 focus-within:ring-[var(--accent-tint)] ${
        dragging ? 'border-[var(--accent-ring)] ring-4 ring-[var(--accent-tint)]' : 'border-[var(--border-default)]'
      }`}
    >
      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-[26px] bg-[var(--panel-bg)]/85 text-[14px] font-medium text-[var(--accent-text)]">
          Solte aqui a logo e as fotos do cliente
        </div>
      )}
      <AttachmentTray state={attachments} />
      <textarea
        ref={textarea}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKey}
        onPaste={(event) => {
          if (event.clipboardData.files.length) {
            event.preventDefault()
            attachments.add(event.clipboardData.files)
          }
        }}
        rows={3}
        maxLength={4000}
        disabled={busy || disabled}
        placeholder={PLACEHOLDERS[placeholder]}
        aria-label="Descreva o site que você quer"
        className="block min-h-[92px] w-full resize-none bg-transparent px-2 py-1.5 text-[15.5px] leading-relaxed text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] disabled:opacity-60"
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="relative flex items-center gap-2">
          <AttachButton onFiles={attachments.add} disabled={busy || disabled} />
          <button
            type="button"
            onClick={() => setStyleOpen((open) => !open)}
            className="flex items-center gap-2 rounded-full border border-[var(--border-default)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--text-secondary)] transition hover:border-[var(--border-strong)]"
            aria-haspopup="listbox"
            aria-expanded={styleOpen}
          >
            <span className="flex -space-x-1">
              {current.swatch.map((color) => (
                <span key={color} className="size-3.5 rounded-full ring-2 ring-[var(--bg-card)]" style={{ background: color }} />
              ))}
            </span>
            {current.label}
            <ChevronDown className="size-3.5" />
          </button>
          {styleOpen && (
            <ul
              role="listbox"
              className="absolute bottom-full left-0 z-20 mb-2 w-56 overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--panel-bg)] p-1 shadow-[var(--shadow-modal)]"
            >
              {STYLES.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={option.value === style}
                    onClick={() => {
                      setStyle(option.value)
                      setStyleOpen(false)
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13px] transition ${
                      option.value === style ? 'bg-[var(--accent-tint)] text-[var(--accent-text)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]'
                    }`}
                  >
                    <span className="flex -space-x-1">
                      {option.swatch.map((color) => (
                        <span key={color} className="size-3.5 rounded-full ring-2 ring-[var(--panel-bg)]" style={{ background: color }} />
                      ))}
                    </span>
                    {option.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex items-center gap-3">
          {footnote && <span className="hidden text-[12px] tabular-nums text-[var(--text-muted)] sm:inline">{footnote}</span>}
          <button
            type="submit"
            disabled={!canSend}
            aria-label="Criar site"
            className="flex size-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#8b5cf6,#6d28d9)] text-white shadow-[0_8px_22px_-10px_rgba(124,58,237,0.9)] transition hover:brightness-110 disabled:opacity-35"
          >
            {busy ? <Loader2 className="size-4.5 animate-spin" /> : <ArrowUp className="size-4.5" strokeWidth={2.4} />}
          </button>
        </div>
      </div>
    </form>
  )
}
