import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Copy, MessageCircle, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useTemplates } from '@/hooks/useTemplates'
import { useAuthContext } from '@/stores/AuthContext'
import { createInteraction } from '@/services/supabase/interactions'
import { createActivity } from '@/services/supabase/dealActivities'
import { getMyPublishedPortfolioLink } from '@/services/supabase/portfolio'
import { whatsappUrl } from '@/utils/contactLinks'
import { fillTemplate, TEMPLATE_CATEGORY_LABELS } from '@/utils/templates'
import type { TemplateCategory } from '@/types'

export interface MessageTarget {
  contact: { id: string; name: string; phone: string | null; city?: string | null; niche?: string | null } | null
  deal?: { id: string; title: string; value: number | null } | null
}

interface SendMessageModalProps {
  open: boolean
  onClose: () => void
  target: MessageTarget
  /** Categoria que abre selecionada (ex.: cobrança num recebível). */
  initialCategory?: TemplateCategory
  onSent?: () => void
}

// Escolhe um modelo, revisa o texto já preenchido e abre o WhatsApp com ele.
// Ao abrir o WhatsApp, a mensagem entra no histórico do contato (e do negócio).
export function SendMessageModal({ open, onClose, target, initialCategory, onSent }: SendMessageModalProps) {
  const { user, profile } = useAuthContext()
  const { templates, loading } = useTemplates()
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [portfolioLink, setPortfolioLink] = useState<string | null>(null)

  useEffect(() => {
    if (open) void getMyPublishedPortfolioLink().then(setPortfolioLink)
  }, [open])

  const context = useMemo(
    () => ({
      nome: target.contact?.name,
      cidade: target.contact?.city,
      nicho: target.contact?.niche,
      negocio: target.deal?.title,
      valor: target.deal?.value,
      meu_nome: profile?.full_name || user?.name,
      minha_empresa: profile?.company_name,
      portfolio: portfolioLink,
    }),
    [target, profile, user, portfolioLink],
  )

  useEffect(() => {
    if (!open || loading || templates.length === 0) return
    const initial =
      templates.find((template) => template.category === initialCategory) ??
      templates.find((template) => template.category === (target.deal ? 'proposta' : 'abordagem')) ??
      templates[0]
    setTemplateId(initial.id)
    setMessage(fillTemplate(initial.body, context))
    // Recalcula só ao abrir ou quando os modelos chegam.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, loading, templates.length, portfolioLink])

  function pick(id: string) {
    const template = templates.find((item) => item.id === id)
    if (!template) return
    setTemplateId(id)
    setMessage(fillTemplate(template.body, context))
  }

  const whatsapp = whatsappUrl(target.contact?.phone)

  async function logSent() {
    const occurred_at = new Date().toISOString()
    try {
      if (target.contact) {
        await createInteraction({ contact_id: target.contact.id, type: 'whatsapp', content: message, occurred_at })
      }
      if (target.deal) {
        await createActivity({ deal_id: target.deal.id, type: 'whatsapp', content: message, occurred_at })
      }
      onSent?.()
    } catch {
      toast.error('A mensagem foi aberta, mas não entrou no histórico.')
    }
  }

  function openWhatsapp() {
    if (!whatsapp || !message.trim()) return
    window.open(`${whatsapp}?text=${encodeURIComponent(message)}`, '_blank', 'noopener')
    void logSent()
    toast.success('WhatsApp aberto. A mensagem foi registrada no histórico.')
    onClose()
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(message)
      toast.success('Mensagem copiada.')
    } catch {
      toast.error('Não foi possível copiar. Selecione o texto e copie manualmente.')
    }
  }

  const grouped = (Object.keys(TEMPLATE_CATEGORY_LABELS) as TemplateCategory[])
    .map((category) => ({ category, items: templates.filter((template) => template.category === category) }))
    .filter((group) => group.items.length > 0)

  return (
    <Modal open={open} onClose={onClose} title="Enviar mensagem" size="lg">
      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-28 rounded-full" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {grouped.map((group) => (
              <div key={group.category} className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 w-full text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)] sm:w-28">
                  {TEMPLATE_CATEGORY_LABELS[group.category]}
                </span>
                {group.items.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    aria-pressed={templateId === template.id}
                    onClick={() => pick(template.id)}
                    className={`h-8 rounded-full border px-3 text-[12.5px] font-medium transition-colors ${
                      templateId === template.id
                        ? 'border-[var(--nav-active-border)] bg-[var(--accent-tint)] text-[var(--accent-text)]'
                        : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={6}
          aria-label="Mensagem"
          className="w-full resize-none rounded-2xl border border-[var(--border-default)] bg-[var(--field-bg)] p-4 text-[14px] leading-6 text-[var(--text-primary)] outline-none transition-all focus:border-[var(--accent-ring)] focus:ring-4 focus:ring-[var(--accent-tint)]"
        />

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/settings#modelos"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-[13px] text-[var(--text-muted)] hover:text-[var(--accent-text)]"
          >
            <Settings2 className="size-4" />
            Editar modelos
          </Link>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="secondary" className="rounded-full" onClick={() => void copy()} disabled={!message.trim()}>
              <Copy className="size-4" />
              Copiar
            </Button>
            <Button className="rounded-full" onClick={openWhatsapp} disabled={!whatsapp || !message.trim()} title={whatsapp ? undefined : 'Contato sem telefone'}>
              <MessageCircle className="size-4" />
              {whatsapp ? 'Abrir no WhatsApp' : 'Sem telefone cadastrado'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
