import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Check, Code2, Copy, ExternalLink } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/ui/Switch'
import { useAuthContext } from '@/stores/AuthContext'
import {
  getMyLeadForm,
  getPortfolioSlug,
  leadFormUrl,
  saveLeadForm,
  type LeadForm,
  type LeadFormInput,
} from '@/services/supabase/leadForm'
import { slugify, validateSlug } from '@/utils/portfolio'

interface LeadFormModalProps {
  open: boolean
  onClose: () => void
}

const QUESTIONS: { key: 'ask_email' | 'ask_niche' | 'ask_city' | 'ask_message'; label: string }[] = [
  { key: 'ask_niche', label: 'Ramo do negócio' },
  { key: 'ask_message', label: 'Mensagem' },
  { key: 'ask_email', label: 'E-mail' },
  { key: 'ask_city', label: 'Cidade' },
]

const DEFAULTS: Omit<LeadFormInput, 'slug'> = {
  enabled: true,
  title: 'Vamos conversar?',
  subtitle: 'Deixe seu WhatsApp que eu te chamo para entender o que você precisa.',
  ask_email: false,
  ask_niche: true,
  ask_city: false,
  ask_message: true,
}

function CopyButton({ text, label, icon }: { text: string; label: string; icon: 'link' | 'code' }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error('Não foi possível copiar. Selecione e copie manualmente.')
    }
  }
  return (
    <Button type="button" variant="secondary" size="md" className="rounded-xl" onClick={() => void copy()}>
      {copied ? <Check className="size-4" /> : icon === 'code' ? <Code2 className="size-4" /> : <Copy className="size-4" />}
      {copied ? 'Copiado' : label}
    </Button>
  )
}

// Configura o link público /f/apelido: quem preenche vira contato no CRM e
// você recebe o aviso.
export function LeadFormModal({ open, onClose }: LeadFormModalProps) {
  const { user, profile } = useAuthContext()
  const [saved, setSaved] = useState<LeadForm | null>(null)
  const [form, setForm] = useState<LeadFormInput | null>(null)
  const [slugError, setSlugError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setSlugError(null)
    void (async () => {
      const existing = await getMyLeadForm().catch(() => null)
      if (cancelled) return
      if (existing) {
        setSaved(existing)
        setForm({
          slug: existing.slug,
          enabled: existing.enabled,
          title: existing.title,
          subtitle: existing.subtitle,
          ask_email: existing.ask_email,
          ask_niche: existing.ask_niche,
          ask_city: existing.ask_city,
          ask_message: existing.ask_message,
        })
        return
      }
      const portfolioSlug = await getPortfolioSlug().catch(() => null)
      if (cancelled) return
      const suggestion = portfolioSlug || slugify(profile?.company_name || profile?.full_name || user?.name || '')
      setSaved(null)
      setForm({ ...DEFAULTS, slug: suggestion.length >= 3 ? suggestion : '' })
    })()
    return () => {
      cancelled = true
    }
  }, [open, profile, user])

  function update<K extends keyof LeadFormInput>(key: K, value: LeadFormInput[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current))
  }

  async function handleSave() {
    if (!form) return
    const slug = slugify(form.slug)
    const problem = validateSlug(slug)
    setSlugError(problem)
    if (problem) return
    if (!form.title.trim()) {
      toast.error('Dê um título ao formulário.')
      return
    }
    setSaving(true)
    try {
      const next = await saveLeadForm({ ...form, slug, title: form.title.trim(), subtitle: form.subtitle?.trim() || null })
      setSaved(next)
      setForm((current) => (current ? { ...current, slug } : current))
      toast.success(saved ? 'Formulário atualizado.' : 'Seu link de captação está no ar.')
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Não foi possível salvar.'
      if (message.includes('Endereço') || message.includes('endereço')) setSlugError(message)
      else toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const url = saved ? leadFormUrl(saved.slug) : null
  const embed = url
    ? `<iframe src="${url}?embed=1" style="width:100%;max-width:560px;height:720px;border:0;border-radius:24px" title="Fale comigo"></iframe>`
    : ''

  return (
    <Modal open={open} onClose={onClose} title="Link de captação" size="md">
      {!form ? (
        <p className="py-8 text-center text-[13.5px] text-[var(--text-muted)]">Carregando…</p>
      ) : (
        <div className="-mr-2 flex max-h-[72vh] flex-col gap-5 overflow-y-auto pr-2">
          <p className="text-[13px] leading-relaxed text-[var(--text-secondary)]">
            Um formulário seu para colocar na bio do Instagram, no WhatsApp ou no seu site. Quem preenche entra no CRM como lead
            (origem “Formulário”), ganha a tarefa “Responder” e você recebe o aviso no celular e no app.
          </p>

          {saved && url && (
            <div className="rounded-2xl border border-[var(--accent-ring)] bg-[var(--accent-tint)] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[12.5px] font-medium text-[var(--text-secondary)]">
                  {saved.enabled ? 'Seu link' : 'Seu link (desligado)'}
                </p>
                <p className="text-[12px] tabular-nums text-[var(--text-muted)]">
                  {saved.submissions} {saved.submissions === 1 ? 'lead recebido' : 'leads recebidos'}
                </p>
              </div>
              <p className="mt-1 break-all font-mono text-[13px] text-[var(--text-primary)]">{url}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <CopyButton text={url} label="Copiar link" icon="link" />
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-muted)] px-4 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-card-hover)]"
                >
                  <ExternalLink className="size-4" />
                  Abrir
                </a>
                <CopyButton text={embed} label="Código para site" icon="code" />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--border-default)] px-4 py-3">
            <div>
              <p className="text-[13.5px] font-medium text-[var(--text-primary)]">Formulário ligado</p>
              <p className="text-[12px] text-[var(--text-muted)]">Desligado, o link mostra “formulário não encontrado”.</p>
            </div>
            <Switch checked={form.enabled} onChange={(value) => update('enabled', value)} ariaLabel="Formulário ligado" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="lead-form-slug" className="text-[13px] font-medium text-[var(--text-secondary)]">
              Endereço
            </label>
            <div
              className={`flex h-11 items-center overflow-hidden rounded-xl border bg-[var(--field-bg)] ${
                slugError ? 'border-red-500/60' : 'border-[var(--border-default)] focus-within:border-[var(--accent-ring)]'
              }`}
            >
              <span className="shrink-0 pl-4 font-mono text-[12.5px] text-[var(--text-muted)]">
                {typeof window !== 'undefined' ? window.location.host : 'codesellers.vercel.app'}/f/
              </span>
              <input
                id="lead-form-slug"
                value={form.slug}
                onChange={(event) => {
                  update('slug', event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                  setSlugError(null)
                }}
                className="h-full min-w-0 flex-1 bg-transparent pr-4 font-mono text-[13px] text-[var(--text-primary)] outline-none"
                placeholder="seu-nome"
              />
            </div>
            {slugError && <p className="text-[12.5px] text-red-500">{slugError}</p>}
          </div>

          <Input label="Título" value={form.title} maxLength={80} onChange={(event) => update('title', event.target.value)} />
          <Input
            label="Texto de apoio"
            value={form.subtitle ?? ''}
            maxLength={280}
            onChange={(event) => update('subtitle', event.target.value)}
          />

          <div>
            <p className="mb-2 text-[13px] font-medium text-[var(--text-secondary)]">
              Perguntar também <span className="font-normal text-[var(--text-muted)]">(nome e WhatsApp sempre)</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              {QUESTIONS.map((question) => (
                <label
                  key={question.key}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-[13px] transition-colors ${
                    form[question.key]
                      ? 'border-[var(--accent-ring)] bg-[var(--accent-tint)] text-[var(--text-primary)]'
                      : 'border-[var(--border-default)] text-[var(--text-secondary)]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form[question.key]}
                    onChange={(event) => update(question.key, event.target.checked)}
                    className="size-4 accent-[#7c3aed]"
                  />
                  {question.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose} disabled={saving}>
          Fechar
        </Button>
        <Button onClick={() => void handleSave()} loading={saving} disabled={!form}>
          {saved ? 'Salvar alterações' : 'Criar meu link'}
        </Button>
      </div>
    </Modal>
  )
}
