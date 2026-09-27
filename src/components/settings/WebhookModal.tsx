import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Check, CheckCircle2, Copy, Send, XCircle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import {
  generateWebhookSecret,
  listWebhookDeliveries,
  sendWebhookTest,
  type WebhookDelivery,
} from '@/services/supabase/webhook'
import { checkWebhookUrl } from '../../../supabase/functions/webhook-dispatch/webhook'
import type { Integration } from '@/types'

const WEBHOOK_EVENT_OPTIONS = [
  { value: 'contact.created', label: 'Contato criado', hint: 'Um contato novo entra no CRM (inclusive pelo Buyers Hunter ou CSV).' },
  { value: 'deal.created', label: 'Negócio criado', hint: 'Um negócio novo é aberto.' },
  { value: 'deal.won', label: 'Negócio ganho', hint: 'Um negócio é marcado como ganho.' },
  { value: 'task.completed', label: 'Tarefa concluída', hint: 'Uma tarefa é marcada como feita.' },
] as const

const EVENT_LABELS: Record<string, string> = {
  ...Object.fromEntries(WEBHOOK_EVENT_OPTIONS.map((option) => [option.value, option.label])),
  test: 'Teste',
}

const EXAMPLE_PAYLOAD = `{
  "id": "e7c1…",
  "event": "deal.won",
  "created_at": "2026-09-27T14:03:12.000Z",
  "data": {
    "deal": {
      "title": "Site institucional",
      "value": 2500,
      "contact": { "name": "Padaria Sol", "phone": "…" }
    }
  }
}`

interface WebhookModalProps {
  open: boolean
  integration: Integration | undefined
  onClose: () => void
  onSave: (config: Record<string, unknown>) => Promise<boolean>
}

function readConfig(integration: Integration | undefined) {
  const config = (integration?.status === 'connected' ? integration.config : null) ?? {}
  return {
    url: typeof config.url === 'string' ? config.url : '',
    secret: typeof config.secret === 'string' ? config.secret : '',
    events: Array.isArray(config.events) ? (config.events as string[]) : WEBHOOK_EVENT_OPTIONS.map((option) => option.value),
  }
}

export function WebhookModal({ open, integration, onClose, onSave }: WebhookModalProps) {
  const connected = integration?.status === 'connected' && Boolean(readConfig(integration).url)
  const [url, setUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [events, setEvents] = useState<string[]>([])
  const [urlError, setUrlError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [deliveries, setDeliveries] = useState<WebhookDelivery[] | null>(null)

  const refreshDeliveries = useCallback(async () => {
    try {
      setDeliveries(await listWebhookDeliveries())
    } catch {
      setDeliveries([])
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const current = readConfig(integration)
    setUrl(current.url)
    setSecret(current.secret || generateWebhookSecret())
    setEvents(current.events)
    setUrlError(null)
    setCopied(false)
    setDeliveries(null)
    if (integration?.status === 'connected') void refreshDeliveries()
    // Só ao abrir: salvar atualiza `integration` e não deve apagar o que foi digitado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function toggleEvent(value: string) {
    setEvents((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]))
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(secret)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error('Não foi possível copiar. Selecione e copie manualmente.')
    }
  }

  async function handleSave() {
    const trimmed = url.trim()
    const error = trimmed ? checkWebhookUrl(trimmed) : 'Informe a URL que vai receber os eventos.'
    setUrlError(error)
    if (error) return
    if (events.length === 0) {
      toast.error('Escolha pelo menos um evento.')
      return
    }
    setSaving(true)
    const ok = await onSave({ url: trimmed, secret, events })
    setSaving(false)
    if (ok && !connected) void refreshDeliveries()
  }

  async function handleTest() {
    setTesting(true)
    try {
      const result = await sendWebhookTest()
      if (result.ok) toast.success(`Teste entregue (resposta ${result.status}).`)
      else toast.error(result.error ?? 'O teste não foi entregue.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível enviar o teste.')
    } finally {
      setTesting(false)
      void refreshDeliveries()
    }
  }

  const savedUrl = readConfig(integration).url
  const unsaved = url.trim() !== savedUrl

  return (
    <Modal open={open} onClose={onClose} title={connected ? 'Webhook' : 'Conectar Webhook'} size="md">
      <div className="-mr-2 flex max-h-[72vh] flex-col gap-5 overflow-y-auto pr-2">
        <p className="text-[13px] leading-relaxed text-[var(--text-secondary)]">
          Quando algo acontece no Code Sellers, mandamos os dados na hora para o endereço abaixo. Serve para ligar o CRM a
          ferramentas de automação, planilhas ou ao seu próprio sistema.
        </p>

        <Input
          label="URL que recebe os eventos"
          placeholder="https://hook.exemplo.com/abc123"
          value={url}
          error={urlError ?? undefined}
          onChange={(event) => {
            setUrl(event.target.value)
            if (urlError) setUrlError(null)
          }}
        />

        <div>
          <p className="mb-2 text-sm font-medium text-[var(--text-secondary)]">Enviar quando</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {WEBHOOK_EVENT_OPTIONS.map((option) => {
              const checked = events.includes(option.value)
              return (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-3.5 py-3 transition-colors ${
                    checked
                      ? 'border-[var(--accent-ring)] bg-[var(--accent-tint)]'
                      : 'border-[var(--border-default)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleEvent(option.value)}
                    className="mt-0.5 size-4 shrink-0 accent-[#7c3aed]"
                  />
                  <span>
                    <span className="block text-[13.5px] font-medium text-[var(--text-primary)]">{option.label}</span>
                    <span className="mt-0.5 block text-[12px] leading-snug text-[var(--text-muted)]">{option.hint}</span>
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-[var(--text-secondary)]">Chave de assinatura</p>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={secret}
              onFocus={(event) => event.currentTarget.select()}
              aria-label="Chave de assinatura"
              className="h-10 min-w-0 flex-1 rounded-xl border border-[var(--border-default)] bg-[var(--field-bg)] px-3 font-mono text-[12px] text-[var(--text-secondary)] outline-none focus:border-[var(--accent-ring)]"
            />
            <Button variant="secondary" size="md" className="shrink-0 rounded-xl" onClick={() => void handleCopy()}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? 'Copiado' : 'Copiar'}
            </Button>
          </div>
          <p className="mt-1.5 text-[12px] leading-snug text-[var(--text-muted)]">
            Opcional: com ela seu sistema confere que o envio veio mesmo do Code Sellers (veja “Como recebo os dados”).
          </p>
        </div>

        <details className="group rounded-2xl border border-[var(--border-default)] px-4 py-3">
          <summary className="cursor-pointer text-[13px] font-medium text-[var(--text-primary)]">Como recebo os dados</summary>
          <div className="mt-3 flex flex-col gap-2 text-[12.5px] leading-relaxed text-[var(--text-secondary)]">
            <p>
              Cada evento chega como um <strong>POST</strong> com corpo JSON. O endereço precisa responder com um código
              2xx em até 10 segundos.
            </p>
            <pre className="overflow-x-auto rounded-xl bg-[var(--bg-muted)] p-3 font-mono text-[11.5px] leading-relaxed text-[var(--text-secondary)]">
              {EXAMPLE_PAYLOAD}
            </pre>
            <p>
              Cabeçalhos: <code className="font-mono">X-CodeSellers-Event</code> (o evento),{' '}
              <code className="font-mono">X-CodeSellers-Delivery</code> (id do envio) e{' '}
              <code className="font-mono">X-CodeSellers-Signature</code> ={' '}
              <code className="font-mono">sha256=</code> + HMAC-SHA256 do corpo com a chave acima, em hexadecimal.
            </p>
          </div>
        </details>

        {connected && (
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-[var(--text-secondary)]">Últimos envios</p>
              <Button
                variant="secondary"
                size="sm"
                className="rounded-full"
                loading={testing}
                disabled={unsaved}
                onClick={() => void handleTest()}
              >
                <Send className="size-3.5" />
                Enviar teste
              </Button>
            </div>
            {deliveries === null ? (
              <p className="text-[12.5px] text-[var(--text-muted)]">Carregando…</p>
            ) : deliveries.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-[var(--border-default)] px-4 py-3 text-[12.5px] text-[var(--text-muted)]">
                Nenhum envio ainda. Clique em “Enviar teste” ou crie um contato para ver o primeiro.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--border-subtle)] rounded-2xl border border-[var(--border-default)]">
                {deliveries.map((delivery) => (
                  <li key={delivery.id} className="flex items-center gap-3 px-3.5 py-2.5">
                    {delivery.ok ? (
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                    ) : (
                      <XCircle className="size-4 shrink-0 text-red-500" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-[var(--text-primary)]">
                        {EVENT_LABELS[delivery.event] ?? delivery.event}
                      </p>
                      <p className="truncate text-[11.5px] text-[var(--text-muted)]">
                        {delivery.ok ? `Entregue · resposta ${delivery.status_code}` : delivery.error ?? 'Falhou'}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11.5px] text-[var(--text-muted)]">
                      {new Date(delivery.created_at).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {unsaved && (
              <p className="mt-1.5 text-[12px] text-[var(--text-muted)]">Salve a nova URL para poder testar.</p>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose} disabled={saving}>
          {connected ? 'Fechar' : 'Cancelar'}
        </Button>
        <Button onClick={() => void handleSave()} loading={saving}>
          {connected ? 'Salvar alterações' : 'Conectar'}
        </Button>
      </div>
    </Modal>
  )
}
