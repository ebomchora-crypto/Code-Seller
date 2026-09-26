import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Copy, FileDown, FileSignature, RefreshCw, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuthContext } from '@/stores/AuthContext'
import { generateContract } from '@/integrations/ai'
import { getLatestContract, saveContract, type DealContract } from '@/services/supabase/contracts'
import { markdownToHtml, openPrintWindow } from '@/utils/printDocument'
import type { Deal } from '@/types'

interface ContractModalProps {
  open: boolean
  onClose: () => void
  deal: Deal
}

interface Details {
  client_document: string
  client_address: string
  provider_document: string
  scope: string
  payment_terms: string
  deadline: string
  support: string
  city: string
}

const fieldClass =
  'w-full rounded-xl border border-[var(--border-default)] bg-[var(--field-bg)] px-3.5 text-[14px] text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-ring)] focus:ring-4 focus:ring-[var(--accent-tint)]'

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-[13px] font-medium text-[var(--text-secondary)]">
      {label}
      {children}
      {hint && <span className="text-[11.5px] font-normal text-[var(--text-muted)]">{hint}</span>}
    </label>
  )
}

// Contrato gerado pelo CS Copilot a partir do negócio: a pessoa completa os
// dados que faltam, revisa o texto, salva no negócio e baixa em PDF.
export function ContractModal({ open, onClose, deal }: ContractModalProps) {
  const { user, profile } = useAuthContext()
  const [existing, setExisting] = useState<DealContract | null>(null)
  const [loadingExisting, setLoadingExisting] = useState(true)
  const [step, setStep] = useState<'form' | 'result'>('form')
  const [details, setDetails] = useState<Details>({
    client_document: '',
    client_address: '',
    provider_document: '',
    scope: [deal.service, deal.notes].filter(Boolean).join(' — '),
    payment_terms: '',
    deadline: '',
    support: '30 dias de ajustes após a entrega',
    city: '',
  })
  const [content, setContent] = useState('')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoadingExisting(true)
    getLatestContract(deal.id)
      .then((contract) => {
        setExisting(contract)
        if (contract) {
          setContent(contract.content)
          setDetails((current) => ({ ...current, ...(contract.details as Partial<Details> | null) }))
          setStep('result')
        } else {
          setStep('form')
        }
      })
      .finally(() => setLoadingExisting(false))
  }, [open, deal.id])

  function update<K extends keyof Details>(key: K, value: Details[K]) {
    setDetails((current) => ({ ...current, [key]: value }))
  }

  async function generate() {
    setGenerating(true)
    try {
      const text = await generateContract({
        provider_name: profile?.full_name || user?.name || '__________',
        provider_company: profile?.company_name ?? null,
        provider_document: details.provider_document || null,
        client_name: deal.contact?.name ?? '__________',
        client_document: details.client_document || null,
        client_address: details.client_address || null,
        service: deal.service || deal.title,
        scope: details.scope,
        value: deal.value,
        payment_terms: details.payment_terms,
        deadline: details.deadline,
        support: details.support || null,
        city: details.city || null,
      })
      setContent(text)
      setStep('result')
      setEditing(false)
    } catch {
      toast.error('Não foi possível gerar o contrato agora. Tente de novo em instantes.')
    } finally {
      setGenerating(false)
    }
  }

  async function save() {
    setSaving(true)
    try {
      const saved = await saveContract(deal.id, content, { ...details }, existing?.id)
      setExisting(saved)
      toast.success('Contrato salvo no negócio.')
    } catch {
      toast.error('Não foi possível salvar o contrato.')
    } finally {
      setSaving(false)
    }
  }

  function downloadPdf() {
    const opened = openPrintWindow(`Contrato — ${deal.title}`, markdownToHtml(content))
    if (!opened) toast.error('O navegador bloqueou a janela. Libere pop-ups para baixar o PDF.')
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(content)
      toast.success('Contrato copiado.')
    } catch {
      toast.error('Não foi possível copiar.')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Contrato de prestação de serviço" size="lg">
      {loadingExisting ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : step === 'form' ? (
        <div className="flex flex-col gap-4" data-lenis-prevent>
          <p className="text-[13.5px] text-[var(--text-muted)]">
            O CS Copilot monta o contrato com os dados do negócio. Complete o que souber; o que faltar fica em branco para
            preencher depois.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="CPF/CNPJ do cliente">
              <input value={details.client_document} onChange={(event) => update('client_document', event.target.value)} className={`${fieldClass} h-10`} />
            </Field>
            <Field label="Seu CPF/CNPJ">
              <input value={details.provider_document} onChange={(event) => update('provider_document', event.target.value)} className={`${fieldClass} h-10`} />
            </Field>
            <Field label="Endereço do cliente">
              <input value={details.client_address} onChange={(event) => update('client_address', event.target.value)} className={`${fieldClass} h-10`} />
            </Field>
            <Field label="Cidade do foro">
              <input value={details.city} onChange={(event) => update('city', event.target.value)} placeholder="Ex.: Ribeirão Preto/SP" className={`${fieldClass} h-10`} />
            </Field>
            <Field label="Prazo de entrega">
              <input value={details.deadline} onChange={(event) => update('deadline', event.target.value)} placeholder="Ex.: 15 dias úteis após o envio dos conteúdos" className={`${fieldClass} h-10`} />
            </Field>
            <Field label="Forma de pagamento">
              <input value={details.payment_terms} onChange={(event) => update('payment_terms', event.target.value)} placeholder="Ex.: 50% na assinatura e 50% na entrega, via Pix" className={`${fieldClass} h-10`} />
            </Field>
          </div>
          <Field label="Escopo" hint="O que está incluído (páginas, funcionalidades, integrações…).">
            <textarea value={details.scope} onChange={(event) => update('scope', event.target.value)} rows={3} className={`${fieldClass} resize-none py-2.5`} />
          </Field>
          <Field label="Suporte e ajustes após a entrega">
            <input value={details.support} onChange={(event) => update('support', event.target.value)} className={`${fieldClass} h-10`} />
          </Field>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[12px] text-[var(--text-muted)]">
              Valor usado: {deal.value !== null ? deal.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'a combinar'}
            </p>
            <div className="flex gap-2">
              {existing && (
                <Button variant="ghost" onClick={() => setStep('result')}>
                  Voltar
                </Button>
              )}
              <Button onClick={() => void generate()} loading={generating} className="rounded-full">
                {!generating && <FileSignature className="size-4" />}
                {generating ? 'Gerando…' : 'Gerar contrato'}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.07] px-4 py-2.5 text-[12.5px] text-amber-700 dark:text-amber-200">
            Modelo gerado por IA. Revise antes de enviar; ele não substitui a orientação de um advogado.
          </p>
          {editing ? (
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={16}
              aria-label="Texto do contrato"
              data-lenis-prevent
              className={`${fieldClass} resize-y py-3 font-mono text-[12.5px] leading-6`}
            />
          ) : (
            <div
              data-lenis-prevent
              className="proposal-markdown max-h-[48vh] overflow-y-auto rounded-2xl border border-[var(--border-default)] p-5 text-[13.5px] text-[var(--text-secondary)] [&_h1]:text-[17px] [&_h2]:text-[15px] [&_h3]:text-[14px]"
            >
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setStep('form')} className="rounded-full">
                <RefreshCw className="size-4" />
                Refazer
              </Button>
              <Button variant="ghost" onClick={() => setEditing((value) => !value)} className="rounded-full">
                {editing ? 'Ver formatado' : 'Editar texto'}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => void copy()} className="rounded-full">
                <Copy className="size-4" />
                Copiar
              </Button>
              <Button variant="secondary" onClick={() => void save()} loading={saving} className="rounded-full">
                {!saving && <Save className="size-4" />}
                Salvar
              </Button>
              <Button onClick={downloadPdf} className="rounded-full">
                <FileDown className="size-4" />
                Baixar PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
