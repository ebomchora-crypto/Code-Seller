import { useEffect, useState, type ReactNode } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/ui/Switch'
import { ImageUploader } from '@/components/portfolio/ImageUploader'
import { PORTFOLIO_CATEGORY_LABELS } from '@/utils/portfolio'
import type { PortfolioCategory, PortfolioProjectInput } from '@/types'

interface ProjectFormModalProps {
  open: boolean
  initial: PortfolioProjectInput | null
  editing: boolean
  saving: boolean
  onClose: () => void
  onSubmit: (input: PortfolioProjectInput) => void
}

const EMPTY: PortfolioProjectInput = {
  title: '',
  client_label: '',
  category: 'site',
  description: '',
  url: '',
  image_url: null,
  testimonial: '',
  testimonial_author: '',
  deal_id: null,
  visible: true,
}

const fieldClass =
  'w-full rounded-xl border border-[var(--border-default)] bg-[var(--field-bg)] px-3.5 text-[14px] text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent-ring)] focus:ring-4 focus:ring-[var(--accent-tint)]'

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-[13px] font-medium text-[var(--text-secondary)]">
      {label}
      {children}
      {hint && <span className="text-[11.5px] font-normal text-[var(--text-muted)]">{hint}</span>}
    </label>
  )
}

function normalizeUrl(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

export function ProjectFormModal({ open, initial, editing, saving, onClose, onSubmit }: ProjectFormModalProps) {
  const [form, setForm] = useState<PortfolioProjectInput>(EMPTY)

  useEffect(() => {
    if (open) setForm({ ...EMPTY, ...initial })
  }, [open, initial])

  function update<K extends keyof PortfolioProjectInput>(key: K, value: PortfolioProjectInput[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function submit() {
    if (!form.title.trim()) return
    onSubmit({
      ...form,
      title: form.title.trim(),
      client_label: form.client_label?.trim() || null,
      description: form.description?.trim() || null,
      url: normalizeUrl(form.url ?? ''),
      testimonial: form.testimonial?.trim() || null,
      testimonial_author: form.testimonial_author?.trim() || null,
    })
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Editar projeto' : 'Novo projeto'} size="lg">
      <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1" data-lenis-prevent>
        <ImageUploader value={form.image_url} onChange={(url) => update('image_url', url)} label="Adicionar imagem do projeto" />
        <p className="-mt-2 text-[11.5px] text-[var(--text-muted)]">Dica: um print da página inicial do site, na horizontal.</p>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Título">
            <input value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="Ex.: Site com agendamento online" className={`${fieldClass} h-10`} />
          </Field>
          <Field label="Tipo">
            <select value={form.category} onChange={(event) => update('category', event.target.value as PortfolioCategory)} className={`${fieldClass} h-10`}>
              {(Object.keys(PORTFOLIO_CATEGORY_LABELS) as PortfolioCategory[]).map((category) => (
                <option key={category} value={category}>
                  {PORTFOLIO_CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Cliente" hint="Nome do cliente (com autorização) ou só o ramo, ex.: Clínica odontológica em Campinas.">
            <input value={form.client_label ?? ''} onChange={(event) => update('client_label', event.target.value)} className={`${fieldClass} h-10`} />
          </Field>
          <Field label="Link do projeto no ar">
            <input value={form.url ?? ''} onChange={(event) => update('url', event.target.value)} placeholder="www.site-do-cliente.com.br" className={`${fieldClass} h-10`} />
          </Field>
        </div>

        <Field label="O que foi feito" hint="O problema do cliente e como o projeto resolveu, em 1 ou 2 frases.">
          <textarea value={form.description ?? ''} onChange={(event) => update('description', event.target.value)} rows={3} className={`${fieldClass} resize-none py-2.5`} />
        </Field>

        <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
          <Field label="Depoimento do cliente (opcional)">
            <textarea value={form.testimonial ?? ''} onChange={(event) => update('testimonial', event.target.value)} rows={2} className={`${fieldClass} resize-none py-2.5`} />
          </Field>
          <Field label="Quem disse">
            <input value={form.testimonial_author ?? ''} onChange={(event) => update('testimonial_author', event.target.value)} placeholder="Ex.: Dra. Carla" className={`${fieldClass} h-10`} />
          </Field>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--border-default)] px-4 py-3">
          <div>
            <p className="text-[14px] font-medium text-[var(--text-primary)]">Mostrar na página</p>
            <p className="text-[12px] text-[var(--text-muted)]">Desligado, o projeto fica salvo mas não aparece para o público.</p>
          </div>
          <Switch checked={form.visible} onChange={(checked) => update('visible', checked)} ariaLabel="Mostrar na página" />
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={submit} loading={saving} disabled={!form.title.trim()}>
          {editing ? 'Salvar projeto' : 'Adicionar projeto'}
        </Button>
      </div>
    </Modal>
  )
}
