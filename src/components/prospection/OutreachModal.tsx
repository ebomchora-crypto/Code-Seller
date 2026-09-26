import { useCallback, useEffect, useState } from 'react'
import { Copy, MessageCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { generateOutreachMessage } from '@/integrations/ai'
import { useAuthContext } from '@/stores/AuthContext'
import { whatsappUrl } from '@/utils/contactLinks'
import { isMobilePhone, OFFER_OPTIONS, WEBSITE_KIND_LABELS } from '@/utils/prospection'
import type { ProspectOffer, ScoredProspect } from '@/types'

interface OutreachModalProps {
  prospect: ScoredProspect | null
  offer: ProspectOffer
  onClose: () => void
}

export function OutreachModal({ prospect, offer, onClose }: OutreachModalProps) {
  const { user, profile } = useAuthContext()
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async () => {
    if (!prospect) return
    setLoading(true)
    setError(null)
    try {
      const text = await generateOutreachMessage({
        business_name: prospect.name,
        category: prospect.category,
        city: prospect.city,
        website_situation:
          prospect.website_kind === 'site' ? `já tem site (${prospect.website})` : WEBSITE_KIND_LABELS[prospect.website_kind].toLowerCase(),
        reviews: prospect.reviews,
        rating: prospect.rating,
        offer_label: OFFER_OPTIONS.find((option) => option.value === offer)?.label ?? 'Site',
        user_name: profile?.full_name || user?.name || 'Eu',
        company_name: profile?.company_name ?? null,
      })
      setMessage(text)
    } catch {
      setError('Não foi possível gerar a mensagem agora. Tente de novo em instantes.')
    } finally {
      setLoading(false)
    }
  }, [prospect, offer, profile, user])

  useEffect(() => {
    if (!prospect) return
    setMessage('')
    void generate()
    // Gera uma vez por empresa aberta; "Gerar outra" chama de novo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prospect?.id])

  const whatsapp = prospect && isMobilePhone(prospect.phone) ? whatsappUrl(prospect.phone) : null

  async function copy() {
    try {
      await navigator.clipboard.writeText(message)
      toast.success('Mensagem copiada.')
    } catch {
      toast.error('Não foi possível copiar. Selecione o texto e copie manualmente.')
    }
  }

  return (
    <Modal open={prospect !== null} onClose={onClose} title="Primeira abordagem" size="md">
      {prospect && (
        <div className="flex flex-col gap-4">
          <p className="text-[13.5px] text-[var(--text-muted)]">
            Mensagem sugerida pelo CS Copilot para <span className="font-medium text-[var(--text-primary)]">{prospect.name}</span>. Revise e ajuste antes de enviar.
          </p>

          {loading ? (
            <div className="flex flex-col gap-2 rounded-2xl border border-[var(--border-default)] p-4">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-[92%]" />
              <Skeleton className="h-3.5 w-[85%]" />
              <Skeleton className="h-3.5 w-[60%]" />
            </div>
          ) : error ? (
            <p className="rounded-2xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-[13.5px] text-red-600 dark:text-red-400">{error}</p>
          ) : (
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={7}
              aria-label="Mensagem de abordagem"
              className="w-full resize-none rounded-2xl border border-[var(--border-default)] bg-[var(--field-bg)] p-4 text-[14px] leading-6 text-[var(--text-primary)] outline-none transition-all focus:border-[var(--accent-ring)] focus:ring-4 focus:ring-[var(--accent-tint)]"
            />
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="ghost" onClick={() => void generate()} disabled={loading} className="rounded-full">
              <RefreshCw className="size-4" />
              Gerar outra
            </Button>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="secondary" onClick={() => void copy()} disabled={loading || !message} className="rounded-full">
                <Copy className="size-4" />
                Copiar
              </Button>
              {whatsapp && (
                <a
                  href={message ? `${whatsapp}?text=${encodeURIComponent(message)}` : whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  aria-disabled={loading || !message}
                  className={`inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#8b5cf6,#6d28d9)] px-4 text-sm font-medium text-white transition-all hover:brightness-110 ${
                    loading || !message ? 'pointer-events-none opacity-50' : ''
                  }`}
                >
                  <MessageCircle className="size-4" />
                  Enviar no WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
