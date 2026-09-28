import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { ChoiceField } from '@/components/ui/ChoiceField'
import { NICHE_SUGGESTIONS } from '@/types'
import { createSite } from '@/services/supabase/codeMaker'
import type { SiteStyle } from '../../../supabase/functions/code-maker/site'

export interface NewSitePrefill {
  businessName?: string
  niche?: string
  city?: string
  phone?: string
  contactId?: string | null
  rating?: number | null
  reviews?: number | null
}

interface NewSiteModalProps {
  open: boolean
  onClose: () => void
  prefill?: NewSitePrefill | null
  onCreated: (siteId: string) => void
}

// Estilos com uma amostra de cor, para escolher sem precisar imaginar.
const STYLES: { value: SiteStyle; label: string; hint: string; swatch: string[] }[] = [
  { value: 'auto', label: 'A IA escolhe', hint: 'Combina com o nicho', swatch: ['#a78bfa', '#f472b6', '#fbbf24'] },
  { value: 'dark', label: 'Moderno escuro', hint: 'Preto + 1 cor forte', swatch: ['#0b0b0f', '#1c1c24', '#22d3ee'] },
  { value: 'minimal', label: 'Minimalista', hint: 'Claro e com respiro', swatch: ['#fafaf9', '#e7e5e4', '#18181b'] },
  { value: 'elegant', label: 'Elegante', hint: 'Serifada, premium', swatch: ['#f5efe6', '#1f2a24', '#b08d57'] },
  { value: 'vibrant', label: 'Vibrante', hint: 'Cores alegres', swatch: ['#ff5a36', '#ffd23f', '#3a86ff'] },
]

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

const EMPTY = { businessName: '', niche: '', city: '', phone: '', details: '' }

export function NewSiteModal({ open, onClose, prefill, onCreated }: NewSiteModalProps) {
  const [values, setValues] = useState(EMPTY)
  const [style, setStyle] = useState<SiteStyle>('auto')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setValues({
      businessName: prefill?.businessName ?? '',
      niche: prefill?.niche ?? '',
      city: prefill?.city ?? '',
      phone: prefill?.phone ? formatPhone(prefill.phone) : '',
      details: '',
    })
    setStyle('auto')
  }, [open, prefill])

  function update(key: keyof typeof EMPTY, value: string) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!values.businessName.trim()) {
      toast.error('Informe o nome do negócio.')
      return
    }
    setSaving(true)
    try {
      const site = await createSite(
        {
          businessName: values.businessName.trim(),
          niche: values.niche.trim() || null,
          city: values.city.trim() || null,
          phone: values.phone.trim() || null,
          style,
          details: values.details.trim() || null,
          rating: prefill?.rating ?? null,
          reviews: prefill?.reviews ?? null,
        },
        prefill?.contactId,
      )
      onCreated(site.id)
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo site" size="lg">
      <form onSubmit={handleSubmit} className="flex max-h-[76vh] flex-col">
        <div className="-mx-1 flex min-h-0 flex-col gap-5 overflow-y-auto px-1 pb-1">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Nome do negócio"
            value={values.businessName}
            onChange={(event) => update('businessName', event.target.value)}
            placeholder="Ex.: Barbearia do João"
            maxLength={120}
            autoFocus
          />
          <Input
            label="WhatsApp do negócio"
            value={values.phone}
            onChange={(event) => update('phone', formatPhone(event.target.value))}
            placeholder="(11) 98888-7777"
            inputMode="tel"
          />
        </div>

        <ChoiceField
          label="Nicho"
          value={values.niche}
          onChange={(value) => update('niche', value)}
          options={NICHE_SUGGESTIONS}
          placeholder="Escolha abaixo ou digite"
          visible={8}
        />

        <Input
          label="Cidade"
          value={values.city}
          onChange={(event) => update('city', event.target.value)}
          placeholder="Ex.: Campinas, SP"
          maxLength={80}
        />

        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-[var(--text-secondary)]">Estilo</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5" role="radiogroup" aria-label="Estilo do site">
            {STYLES.map((option) => {
              const active = option.value === style
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setStyle(option.value)}
                  className={`flex flex-col gap-2 rounded-2xl border p-3 text-left transition ${
                    active
                      ? 'border-[var(--accent-ring)] bg-[var(--accent-tint)]'
                      : 'border-[var(--border-default)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <span className="flex -space-x-1.5">
                    {option.swatch.map((color) => (
                      <span key={color} className="size-5 rounded-full ring-2 ring-[var(--panel-bg)]" style={{ background: color }} />
                    ))}
                  </span>
                  <span>
                    <span className="block text-[13px] font-semibold text-[var(--text-primary)]">{option.label}</span>
                    <span className="block text-[11.5px] text-[var(--text-muted)]">{option.hint}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <Textarea
          label="O que o site precisa ter? (opcional)"
          value={values.details}
          onChange={(event) => update('details', event.target.value)}
          placeholder="Serviços e preços, diferenciais, horário, endereço, cores da marca, Instagram… Quanto mais detalhe, mais o site fica com a cara do negócio."
          rows={4}
          maxLength={1500}
        />

        </div>

        <div className="mt-4 flex flex-col-reverse gap-2 border-t border-[var(--border-default)] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12.5px] text-[var(--text-muted)]">Leva de 2 a 4 minutos. Você acompanha tudo ao vivo.</p>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              Criar site
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
