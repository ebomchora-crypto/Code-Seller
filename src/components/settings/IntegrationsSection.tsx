import { useState } from 'react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { IntegrationCard } from '@/components/settings/IntegrationCard'
import type { Integration, IntegrationConfig, IntegrationType } from '@/types'

interface IntegrationsSectionProps {
  integrations: Integration[]
  onConnect: (type: IntegrationType, config: Record<string, unknown>) => Promise<boolean>
  onDisconnect: (type: IntegrationType) => Promise<void>
}

const INTEGRATION_META: Record<Omit<IntegrationConfig, 'status' | 'connected_at'>['type'], Omit<IntegrationConfig, 'status' | 'connected_at'>> = {
  whatsapp: {
    type: 'whatsapp',
    label: 'WhatsApp Business',
    description: 'Envie mensagens diretamente do CRM',
    icon: 'MessageCircle',
    docs_url: 'https://developers.facebook.com/docs/whatsapp',
  },
  google_calendar: {
    type: 'google_calendar',
    label: 'Google Calendar',
    description: 'Sincronize tarefas com seu calendário',
    icon: 'Calendar',
    docs_url: 'https://developers.google.com/calendar',
  },
  google_contacts: {
    type: 'google_contacts',
    label: 'Google Contacts',
    description: 'Importe contatos do Google',
    icon: 'Users',
    docs_url: 'https://developers.google.com/people',
  },
  zapier: {
    type: 'zapier',
    label: 'Zapier',
    description: 'Conecte o Code Sellers a milhares de apps',
    icon: 'Zap',
    docs_url: 'https://zapier.com/developer',
  },
  webhook: {
    type: 'webhook',
    label: 'Webhook',
    description: 'Receba eventos do Code Sellers em qualquer URL',
    icon: 'Webhook',
    docs_url: 'https://en.wikipedia.org/wiki/Webhook',
  },
}

const WEBHOOK_EVENTS = [
  { value: 'deal.created', label: 'Negócio criado' },
  { value: 'deal.won', label: 'Negócio ganho' },
  { value: 'contact.created', label: 'Contato criado' },
  { value: 'task.completed', label: 'Tarefa concluída' },
]

function generateApiKey(): string {
  return `cs_${crypto.randomUUID().replace(/-/g, '')}`
}

export function IntegrationsSection({ integrations, onConnect, onDisconnect }: IntegrationsSectionProps) {
  const [connectingType, setConnectingType] = useState<IntegrationType | null>(null)
  const [disconnectingType, setDisconnectingType] = useState<IntegrationType | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookEvent, setWebhookEvent] = useState(WEBHOOK_EVENTS[0].value)
  const [testingWebhook, setTestingWebhook] = useState(false)
  const [zapierKey, setZapierKey] = useState('')

  const configs: IntegrationConfig[] = integrations.map((integration) => ({
    ...INTEGRATION_META[integration.type],
    status: integration.status,
    connected_at: integration.connected_at,
  }))

  function openModal(type: IntegrationType) {
    setConnectingType(type)
    if (type === 'zapier') setZapierKey(generateApiKey())
  }

  function closeModal() {
    setConnectingType(null)
    setWhatsappNumber('')
    setWebhookUrl('')
    setWebhookEvent(WEBHOOK_EVENTS[0].value)
  }

  async function handleConnect() {
    if (!connectingType) return
    setSubmitting(true)

    let config: Record<string, unknown> = {}
    if (connectingType === 'whatsapp') {
      if (!whatsappNumber.trim()) {
        toast.error('Informe o número do WhatsApp Business.')
        setSubmitting(false)
        return
      }
      config = { phone_number: whatsappNumber.trim() }
    } else if (connectingType === 'webhook') {
      if (!webhookUrl.trim()) {
        toast.error('Informe a URL do webhook.')
        setSubmitting(false)
        return
      }
      config = { url: webhookUrl.trim(), event: webhookEvent }
    } else if (connectingType === 'zapier') {
      config = { api_key: zapierKey }
    } else {
      // google_calendar / google_contacts
      // TODO: implementar OAuth real com Google para google_calendar/google_contacts.
      config = { oauth: 'pending' }
    }

    const success = await onConnect(connectingType, config)
    setSubmitting(false)
    if (success) closeModal()
  }

  async function handleTestWebhook() {
    if (!webhookUrl.trim()) {
      toast.error('Informe a URL do webhook antes de testar.')
      return
    }
    setTestingWebhook(true)
    try {
      await fetch(webhookUrl.trim(), {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ event: 'test', source: 'code-sellers', sent_at: new Date().toISOString() }),
      })
      toast.success('Requisição de teste enviada. Confira o destino do webhook.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível enviar o teste.')
    } finally {
      setTestingWebhook(false)
    }
  }

  return (
    <section id="integrações" className="scroll-mt-6">
      <Card>
        <span className="label-caps">Sistema</span>
        <h2 className="mt-1 text-2xl font-medium tracking-tightest text-neutral-900">Integrações</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Nenhuma integração real está ativa neste MVP — a conexão abaixo apenas estrutura a UI e salva a
          configuração no banco.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {configs.map((config) => (
            <IntegrationCard
              key={config.type}
              config={config}
              onConnect={() => openModal(config.type)}
              onDisconnect={() => setDisconnectingType(config.type)}
            />
          ))}
        </div>
      </Card>

      <Modal
        open={connectingType !== null}
        onClose={closeModal}
        title={connectingType ? `Conectar ${INTEGRATION_META[connectingType].label}` : ''}
        size="sm"
      >
        {connectingType === 'whatsapp' && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-neutral-600">
              Informe o número usado na sua conta do WhatsApp Business API.
              {/* TODO: implementar integração real com a WhatsApp Business API. */}
            </p>
            <Input
              label="Número do WhatsApp"
              placeholder="+55 11 99999-9999"
              value={whatsappNumber}
              onChange={(event) => setWhatsappNumber(event.target.value)}
            />
          </div>
        )}

        {(connectingType === 'google_calendar' || connectingType === 'google_contacts') && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-neutral-600">
              A conexão real via OAuth com o Google ainda não está implementada neste MVP.
              {/* TODO: implementar OAuth real com Google para google_calendar/google_contacts. */}
            </p>
            <Button variant="secondary" onClick={handleConnect} loading={submitting}>
              Conectar com Google
            </Button>
          </div>
        )}

        {connectingType === 'zapier' && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-neutral-600">Use esta chave para conectar o Code Sellers ao Zapier.</p>
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 font-mono text-xs text-neutral-700">
              {zapierKey}
            </div>
            {/* TODO: implementar integração real com a API do Zapier. */}
          </div>
        )}

        {connectingType === 'webhook' && (
          <div className="flex flex-col gap-4">
            <Input
              label="URL do webhook"
              placeholder="https://exemplo.com/webhook"
              value={webhookUrl}
              onChange={(event) => setWebhookUrl(event.target.value)}
            />
            <Select label="Evento" value={webhookEvent} onChange={(event) => setWebhookEvent(event.target.value)}>
              {WEBHOOK_EVENTS.map((event) => (
                <option key={event.value} value={event.value}>
                  {event.label}
                </option>
              ))}
            </Select>
            <Button variant="ghost" size="sm" onClick={handleTestWebhook} loading={testingWebhook}>
              Testar webhook
            </Button>
          </div>
        )}

        {connectingType !== 'google_calendar' && connectingType !== 'google_contacts' && (
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" onClick={closeModal} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={handleConnect} loading={submitting}>
              Salvar conexão
            </Button>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={disconnectingType !== null}
        title="Desconectar integração"
        message="Tem certeza que deseja desconectar esta integração?"
        confirmLabel="Desconectar"
        onConfirm={async () => {
          if (disconnectingType) await onDisconnect(disconnectingType)
          setDisconnectingType(null)
        }}
        onCancel={() => setDisconnectingType(null)}
      />
    </section>
  )
}
