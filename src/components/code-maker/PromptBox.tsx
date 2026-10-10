import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { SiteStyle } from '../../../supabase/functions/code-maker/site'
import type { AttachmentsState } from '@/components/code-maker/Attachments'
import { PromptInputBox } from '@/components/ui/ai-prompt-box'

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

// Pedido de um site novo: a caixa de pedido do Code Maker, com o estilo do site como opção.
export function PromptBox({ value, onChange, onSubmit, busy, disabled = false, footnote, attachments }: PromptBoxProps) {
  const [style, setStyle] = useState<SiteStyle>('auto')
  const [styleOpen, setStyleOpen] = useState(false)
  const current = STYLES.find((option) => option.value === style) ?? STYLES[0]
  const canSend = value.trim().length >= 8 && !attachments.uploading

  const styleChip = (
    <div className="relative">
      <button
        type="button"
        onClick={() => setStyleOpen((open) => !open)}
        className="flex h-8 items-center gap-2 rounded-full border border-[var(--border-default)] px-3 text-[12.5px] font-medium text-[var(--text-secondary)] transition hover:border-[var(--accent-ring)] hover:text-[var(--text-primary)]"
        aria-haspopup="listbox"
        aria-expanded={styleOpen}
      >
        <span className="flex -space-x-1">
          {current.swatch.map((color) => (
            <span key={color} className="size-3.5 rounded-full ring-2 ring-[var(--bg-card)]" style={{ background: color }} />
          ))}
        </span>
        <span className="hidden sm:inline">{current.label}</span>
        <span className="sm:hidden">Estilo</span>
        <ChevronDown className="size-3.5" />
      </button>
      {styleOpen && (
        <ul role="listbox" className="absolute bottom-full left-0 z-30 mb-2 w-60 overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--panel-bg)] p-1 shadow-[var(--shadow-modal)]">
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
  )

  return (
    <PromptInputBox
      value={value}
      onValueChange={onChange}
      onSend={() => onSubmit(style)}
      isLoading={busy}
      disabled={disabled}
      canSend={canSend}
      rows={3}
      minHeight={96}
      maxHeight={480}
      placeholder={PLACEHOLDERS}
      ariaLabel="Descreva o site que você quer"
      attachments={attachments}
      tools={styleChip}
      footnote={footnote}
    />
  )
}
