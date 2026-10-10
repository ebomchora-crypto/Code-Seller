import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { getCodeMakerUsage, type CodeMakerUsage } from '@/services/supabase/codeMaker'
import type { SiteStyle } from '../../../supabase/functions/code-maker/site'

export const DEFAULT_STYLE_KEY = 'cs-code-maker:default-style'
export const STYLE_OPTIONS: { value: SiteStyle; label: string; swatch: string[] }[] = [
  { value: 'auto', label: 'A IA escolhe o estilo', swatch: ['#a78bfa', '#f472b6', '#fbbf24'] },
  { value: 'dark', label: 'Moderno escuro', swatch: ['#0b0b0f', '#1c1c24', '#22d3ee'] },
  { value: 'minimal', label: 'Minimalista', swatch: ['#fafaf9', '#e7e5e4', '#18181b'] },
  { value: 'elegant', label: 'Elegante', swatch: ['#f5efe6', '#1f2a24', '#b08d57'] },
  { value: 'vibrant', label: 'Vibrante', swatch: ['#ff5a36', '#ffd23f', '#3a86ff'] },
]

export function readDefaultStyle(): SiteStyle {
  try {
    const value = window.localStorage.getItem(DEFAULT_STYLE_KEY)
    return STYLE_OPTIONS.some((option) => option.value === value) ? (value as SiteStyle) : 'auto'
  } catch {
    return 'auto'
  }
}

// Configurações do Code Maker: estilo que já vem escolhido nos sites novos e o uso do dia.
export function CodeMakerSettings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [style, setStyle] = useState<SiteStyle>(readDefaultStyle)
  const [usage, setUsage] = useState<CodeMakerUsage | null>(null)

  useEffect(() => {
    if (!open) return
    setStyle(readDefaultStyle())
    let alive = true
    getCodeMakerUsage()
      .then((value) => alive && setUsage(value))
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [open])

  function choose(value: SiteStyle) {
    setStyle(value)
    try {
      window.localStorage.setItem(DEFAULT_STYLE_KEY, value)
    } catch {
      // Sem armazenamento: vale só nesta visita.
    }
    window.dispatchEvent(new Event('cs-code-maker:style'))
  }

  const meter = (label: string, used: number, limit: number | null) => (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-3.5">
      <div className="flex items-baseline justify-between text-[13px]">
        <span className="text-[var(--text-secondary)]">{label}</span>
        <span className="font-semibold tabular-nums text-[var(--text-primary)]">{limit == null ? `${used} · sem limite` : `${used} de ${limit}`}</span>
      </div>
      {limit != null && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--bg-muted)]">
          <div className="h-full rounded-full bg-[linear-gradient(90deg,#8b5cf6,#6d28d9)]" style={{ width: `${Math.min(100, (used / Math.max(1, limit)) * 100)}%` }} />
        </div>
      )}
    </div>
  )

  return (
    <Modal open={open} onClose={onClose} title="Configurações do Code Maker" size="md">
      <div className="flex flex-col gap-5">
        <section>
          <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">Estilo padrão dos sites novos</h3>
          <p className="mt-0.5 text-[12.5px] text-[var(--text-muted)]">Já vem escolhido quando você pede um site. Dá para trocar em cada pedido.</p>
          <div role="radiogroup" aria-label="Estilo padrão" className="mt-3 grid gap-2 sm:grid-cols-2">
            {STYLE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={option.value === style}
                onClick={() => choose(option.value)}
                className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-[13px] transition ${
                  option.value === style
                    ? 'border-[var(--accent-ring)] bg-[var(--accent-tint)] font-semibold text-[var(--accent-text)]'
                    : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                }`}
              >
                <span className="flex -space-x-1">
                  {option.swatch.map((color) => (
                    <span key={color} className="size-4 rounded-full ring-2 ring-[var(--bg-card)]" style={{ background: color }} />
                  ))}
                </span>
                {option.label}
              </button>
            ))}
          </div>
        </section>
        <section>
          <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">Seu uso hoje</h3>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {usage ? (
              <>
                {meter('Sites criados', usage.sites_today, usage.sites_limit)}
                {meter('Alterações', usage.edits_today, usage.edits_limit)}
              </>
            ) : (
              <p className="text-[12.5px] text-[var(--text-muted)]">Carregando…</p>
            )}
          </div>
        </section>
      </div>
    </Modal>
  )
}
